/**
 * Minimal multi-instance example.
 *
 * Run Valkey first:
 *   docker compose up -d
 *
 * Then start two instances on different ports:
 *   PORT=3000 node example/index.js
 *   PORT=3001 node example/index.js
 *
 * A message emitted on one instance reaches clients connected to the other,
 * because both instances coordinate through Valkey Pub/Sub.
 */
const { createServer } = require("http");
const { Server } = require("socket.io");
const { createAdapter } = require("../dist");
const Valkey = require("iovalkey");

const PORT = process.env.PORT || 3000;

const pubClient = new Valkey({ host: "localhost", port: 6379 });
const subClient = pubClient.duplicate();

const httpServer = createServer();
const io = new Server(httpServer, {
  adapter: createAdapter(pubClient, subClient),
});

io.on("connection", (socket) => {
  console.log(`[${PORT}] client connected: ${socket.id}`);

  socket.join("global");

  socket.on("chat", (msg) => {
    // broadcast to everyone in the "global" room across ALL instances
    io.to("global").emit("chat", `[from ${PORT}] ${msg}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server (Valkey adapter) listening on ${PORT}`);
});
