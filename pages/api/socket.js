import { initSocketServer } from "../../lib/socket.js";

export const config = {
  api: {
    // Socket.io needs the raw HTTP request for the upgrade
    bodyParser: false,
  },
};

export default function handler(req, res) {
  // `res.socket.server` is provided by Next's built‑in HTTP server.
  // On Vercel this persists across invocations, so we can attach Socket.io once.
  if (!res.socket?.server) {
    res.status(500).json({ error: "Socket server unavailable" });
    return;
  }

  // Initialise the singleton Socket.io server (no‑op if already created).
  initSocketServer(res.socket.server);

  // Let Socket.io handle the upgrade/polling requests.
  res.end();
}
