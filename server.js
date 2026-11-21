import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initSocketServer } from "./lib/socket.js";
import { assertSecureConfig } from "./lib/server/config/env.js";
import logger from "./lib/server/logging/logger.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = dev ? "localhost" : "0.0.0.0";
const port = process.env.PORT || 3000;

// Refuse to boot in production with a missing/weak secret or a non-https URL.
const problems = assertSecureConfig();
problems.forEach((p) => logger.warn("Configuration problem", { problem: p }));

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      await handle(req, res, parse(req.url, true));
    } catch (err) {
      logger.error("Error handling request", { url: req.url?.split("?")[0], err });
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  initSocketServer(httpServer);

  httpServer
    .once("error", (err) => {
      logger.error("HTTP server error", { err });
      process.exit(1);
    })
    .listen(port, () => logger.info(`Ready on http://${hostname}:${port}`));

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down`);
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
});
