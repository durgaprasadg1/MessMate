/**
 * Typed HTTP errors. Handlers `throw` these; the API wrapper turns them into
 * safe JSON responses. Anything that is NOT an HttpError is treated as an
 * internal error and its message is never sent to the client.
 */
export class HttpError extends Error {
  constructor(status, message, { code, details, headers } = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.headers = headers;
  }
}

export const badRequest = (m = "Bad request", o) => new HttpError(400, m, o);
export const unauthorized = (m = "Unauthorized", o) =>
  new HttpError(401, m, o);
export const forbidden = (m = "Forbidden", o) => new HttpError(403, m, o);
export const notFound = (m = "Not found", o) => new HttpError(404, m, o);
export const conflict = (m = "Conflict", o) => new HttpError(409, m, o);
export const payloadTooLarge = (m = "Payload too large", o) =>
  new HttpError(413, m, o);
export const unsupportedMedia = (m = "Unsupported media type", o) =>
  new HttpError(415, m, o);

export function tooManyRequests(
  retryAfterSeconds,
  message = "Too many requests. Please try again later.",
) {
  const retryAfter = Math.max(1, Math.ceil(retryAfterSeconds || 1));
  return new HttpError(429, message, {
    code: "RATE_LIMITED",
    headers: { "Retry-After": String(retryAfter) },
    details: { retryAfter },
  });
}

export const isHttpError = (e) => e instanceof HttpError;
