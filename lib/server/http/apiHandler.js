/**
 * `createRoute` - the one place where cross-cutting API concerns live
 * (Single Responsibility for handlers, Open/Closed for new concerns):
 *
 *   request-id -> CSRF origin check -> rate limit -> authentication /
 *   authorisation -> param validation -> body parsing + zod validation ->
 *   handler -> uniform, non-leaking error responses + audit/access logging
 *
 * Handlers contain only business logic and `throw` HttpErrors.
 */
import crypto from "node:crypto";
import { ZodError } from "zod";
import { NextResponse } from "next/server";
import logger from "../logging/logger.js";
import { audit, AuditEvent } from "../logging/audit.js";
import { HttpError, badRequest, forbidden, notFound, unsupportedMedia, payloadTooLarge } from "../errors/httpErrors.js";
import { checkOrigin, isMutating } from "./origin.js";
import { getClientIp } from "../security/clientIp.js";
import { getRateLimiter, Limits } from "../security/rateLimiter.js";
import { isUuid } from "./params.js";
import { NO_STORE } from "./respond.js";
import * as guards from "../auth/guards.js";

const MAX_JSON_BYTES = 256 * 1024;

const AUTH_STRATEGIES = {
  public: async () => null,
  session: () => guards.requireSession(),
  admin: () => guards.requireAdmin(),
  owner: () => guards.requireOwner(),
  consumer: () => guards.requireConsumer(),
};

async function parseBody(request, { body, bodyType }) {
  if (bodyType === "none") return undefined;
  if (bodyType === "raw") return request.text();
  if (bodyType === "formData") {
    const ct = request.headers.get("content-type") || "";
    if (!ct.toLowerCase().includes("multipart/form-data")) throw unsupportedMedia("Expected multipart/form-data");
    return request.formData();
  }

  // json (default). Empty bodies are allowed when the route has no schema.
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_JSON_BYTES) throw payloadTooLarge();
  const text = await request.text();
  if (!text) {
    if (!body) return undefined;
    return validate(body, {});
  }
  if (text.length > MAX_JSON_BYTES) throw payloadTooLarge();
  const ct = (request.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("application/json")) throw unsupportedMedia("Content-Type must be application/json");
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw badRequest("Invalid JSON body");
  }
  return body ? validate(body, parsed) : parsed;
}

function validate(schema, data) {
  const res = schema.safeParse(data);
  if (res.success) return res.data;
  throw new HttpError(400, "Validation failed", {
    code: "VALIDATION_FAILED",
    details: res.error.flatten(),
  });
}

function errorResponse(err, log, requestId) {
  if (err instanceof HttpError) {
    const body = { message: err.message, error: err.message, requestId };
    if (err.code) body.code = err.code;
    if (err.details?.retryAfter) body.retryAfter = err.details.retryAfter;
    else if (err.details && err.status < 500) body.errors = err.details;
    return NextResponse.json(body, { status: err.status, headers: { ...NO_STORE, ...err.headers, "x-request-id": requestId } });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { message: "Validation failed", error: "Validation failed", errors: err.flatten(), requestId },
      { status: 400, headers: { ...NO_STORE, "x-request-id": requestId } },
    );
  }
  // Unknown failure: log everything server-side, tell the client nothing.
  log.error("Unhandled error in API route", { err, stack: err?.stack });
  return NextResponse.json(
    { message: "Internal server error", error: "Internal server error", requestId },
    { status: 500, headers: { ...NO_STORE, "x-request-id": requestId } },
  );
}

/**
 * @param {{
 *   name: string,
 *   auth?: "public"|"session"|"admin"|"owner"|"consumer"|((ctx:any)=>Promise<any>),
 *   csrf?: boolean,
 *   rateLimit?: false | { name: string, limit: number, windowSeconds: number, by?: "ip"|"user" },
 *   uuid?: string[],
 *   body?: import("zod").ZodTypeAny,
 *   bodyType?: "json"|"formData"|"raw"|"none",
 *   cache?: "no-store"|"public"
 * }} options
 * @param {(ctx: any) => Promise<Response>} handler
 */
export function createRoute(options, handler) {
  const { name, auth = "session", uuid = [], rateLimit, body, bodyType, cache = "no-store" } = options;
  const authenticate = typeof auth === "function" ? auth : AUTH_STRATEGIES[auth];
  if (!authenticate) throw new Error(`createRoute(${name}): unknown auth strategy "${auth}"`);

  return async function route(request, routeCtx = {}) {
    const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
    const ip = getClientIp(request);
    const started = Date.now();
    const log = logger.child({ route: name, method: request.method, requestId, ip });
    let status = 500;

    try {
      // 1. CSRF
      const csrf = options.csrf ?? isMutating(request.method);
      if (csrf) {
        const res = checkOrigin(request);
        if (!res.ok) {
          audit(AuditEvent.CSRF_BLOCKED, { reason: res.reason, route: name, ip, requestId }, log);
          throw forbidden("Request origin not allowed", { code: "CSRF" });
        }
      }

      // 2. IP-based rate limit (before any DB / auth work)
      const limiter = await getRateLimiter();
      const rule = rateLimit === false ? null : rateLimit ?? (isMutating(request.method) ? { ...Limits.mutate, by: "user" } : null);
      if (rule && (rule.by ?? "ip") === "ip") {
        await enforceLimit(limiter, rule, `${name}:ip:${ip}`, { route: name, ip, requestId }, log);
      }

      // 3. Authentication / authorisation
      const params = (await routeCtx.params) || {};
      for (const key of uuid) {
        if (!isUuid(params[key])) throw badRequest("Invalid identifier");
      }
      const session = await authenticate({ request, params, log });
      const actor = session?.user ? { actorId: session.user.id, actorRole: guards.roleOf(session) } : {};
      const ctxLog = actor.actorId ? log.child(actor) : log;

      // 3b. per-user rate limit once we know who it is
      if (rule && rule.by === "user") {
        await enforceLimit(limiter, rule, `${name}:u:${session?.user?.id ?? ip}`, { route: name, ip, requestId, ...actor }, ctxLog);
      }

      // 4. Body
      const parsedBody = isMutating(request.method) ? await parseBody(request, { body, bodyType }) : undefined;

      // 5. Business logic
      const response = await handler({ request, params, session, body: parsedBody, log: ctxLog, ip, requestId });
      status = response?.status ?? 200;

      response.headers.set("x-request-id", requestId);
      if (cache === "no-store" && !response.headers.has("Cache-Control")) {
        response.headers.set("Cache-Control", "no-store");
      }
      return response;
    } catch (err) {
      const res = errorResponse(err, log, requestId);
      status = res.status;
      if (status === 401 || status === 403) {
        log.warn("Access denied", { status, reason: err?.message });
      }
      return res;
    } finally {
      log.info("request", { status, ms: Date.now() - started });
    }
  };
}

async function enforceLimit(limiter, rule, key, auditFields, log) {
  try {
    await limiter.enforce({ name: rule.name, key, limit: rule.limit, windowSeconds: rule.windowSeconds });
  } catch (err) {
    if (err instanceof HttpError && err.status === 429) {
      audit(AuditEvent.RATE_LIMITED, { rule: rule.name, ...auditFields }, log);
    }
    throw err;
  }
}

/** Convenience for handlers: look up -> 404 when absent. */
export function ensureFound(value, message = "Not found") {
  if (!value) throw notFound(message);
  return value;
}
