import { Server } from "socket.io";
import { getToken } from "next-auth/jwt";
import logger from "./server/logging/logger.js";
import { getEnv } from "./server/config/env.js";
import { messRepository } from "./server/repositories/messes.js";

let io;
const log = logger.child({ module: "socket" });

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const i = c.indexOf("=");
        return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))];
      }),
  );
}

/** Same-origin check for the websocket handshake (browsers always send Origin). */
export function isAllowedSocketOrigin(headers, env = getEnv()) {
  const origin = headers.origin;
  if (!origin) return !env.isProduction; // non-browser clients only in dev
  try {
    const host = new URL(origin).host.toLowerCase();
    const own = (headers["x-forwarded-host"] || headers.host || "").split(",")[0].trim().toLowerCase();
    const configured = env.baseUrl ? new URL(env.baseUrl).host.toLowerCase() : null;
    return host === own || host === configured || (!env.isProduction && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host));
  } catch {
    return false;
  }
}

/**
 * Authenticates a socket from the NextAuth session cookie. The client can no
 * longer pick its own rooms (previously any client could `emit("join", otherUserId)`
 * and read another person's notifications).
 */
export async function authenticateSocket(socket) {
  const headers = socket.handshake.headers;
  const token = await getToken({
    req: { headers, cookies: parseCookies(headers.cookie) },
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token?.id) throw new Error("unauthorized");
  return token;
}

export const initSocketServer = (httpServer) => {
  if (io) return io;
  const env = getEnv();

  io = new Server(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: env.baseUrl ? { origin: env.baseUrl, methods: ["GET", "POST"], credentials: true } : undefined,
    // reject at the HTTP handshake: wrong origin or no valid session cookie
    allowRequest: async (req, cb) => {
      if (!isAllowedSocketOrigin(req.headers, env)) return cb(null, false);
      try {
        const token = await authenticateSocket({ handshake: { headers: req.headers } });
        cb(null, Boolean(token?.id));
      } catch {
        cb(null, false);
      }
    },
  });

  io.use(async (socket, next) => {
    try {
      socket.data.user = await authenticateSocket(socket);
      next();
    } catch {
      log.warn("Socket rejected: not authenticated", { socketId: socket.id });
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const { id, isOwner } = socket.data.user;
    socket.join(`user_${id}`);
    if (isOwner) {
      try {
        for (const messId of await messRepository.idsByOwner(id)) socket.join(`mess_${messId}`);
      } catch (err) {
        log.warn("Could not join mess rooms", { err });
      }
    }
    log.debug("Socket connected", { socketId: socket.id, userId: id });
    // legacy client events are accepted but ignored: rooms are derived from the session only
    socket.on("join", () => {});
    socket.on("join-mess", () => {});
    socket.on("disconnect", () => log.debug("Socket disconnected", { socketId: socket.id }));
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

export const emitToUser = (userId, event, data) => {
  if (io) io.to(`user_${userId}`).emit(event, data);
};

export const emitToMess = (messId, event, data) => {
  if (io) io.to(`mess_${messId}`).emit(event, data);
};
