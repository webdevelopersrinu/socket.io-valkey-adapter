# Socket.IO Valkey adapter

The `socket.io-valkey-adapter` package allows broadcasting packets between multiple Socket.IO servers using [Valkey](https://valkey.io) Pub/Sub.

It is a native Valkey port of the official [`@socket.io/redis-adapter`](https://github.com/socketio/socket.io-redis-adapter) — same proven architecture, but backed by Valkey (open source forever, BSD) instead of Redis. It works with any ioredis-compatible Valkey client, such as [`iovalkey`](https://github.com/valkey-io/iovalkey).

**Team:** Stalwart Team · Valkey Hackathon 2026 (Track A — Integration #27)

## How it works

A single Socket.IO server only knows about the clients connected to it. When you run multiple server instances, this adapter keeps them in sync:

1. Every server instance connects to the same Valkey server.
2. When a server broadcasts, it **publishes** the packet (with target rooms / excluded sockets) to a Valkey channel.
3. Every server **subscribes** to that channel and receives the packet.
4. Each receiving server delivers it to its **own local clients** matching the target rooms.

Cluster-wide operations (`fetchSockets()`, `socketsJoin()`, `serverSideEmit()`, remote disconnects, etc.) use a **request/response pattern over Pub/Sub** — a request is published with a unique id, every server replies, and the requester aggregates the responses until all answer or a timeout is reached.

## Installation

```bash
npm install socket.io-valkey-adapter iovalkey
```

## Usage

```js
const { Server } = require("socket.io");
const { createAdapter } = require("socket.io-valkey-adapter");
const Valkey = require("iovalkey");

const pubClient = new Valkey({ host: "localhost", port: 6379 });
const subClient = pubClient.duplicate();

const io = new Server({
  adapter: createAdapter(pubClient, subClient),
});

io.listen(3000);
```

### Sharded Pub/Sub

A sharded adapter (using Valkey sharded Pub/Sub) is also available:

```js
const { createShardedAdapter } = require("@socket.io/valkey-adapter");

const io = new Server({
  adapter: createShardedAdapter(pubClient, subClient),
});
```

## Options

| Name                               | Description                                                                  | Default     |
| ---------------------------------- | ---------------------------------------------------------------------------- | ----------- |
| `key`                              | The prefix for the Valkey Pub/Sub channels.                                  | `socket.io` |
| `requestsTimeout`                  | After this timeout the adapter stops waiting for responses to a request.     | `5000`      |
| `publishOnSpecificResponseChannel` | Whether to publish responses to the channel specific to the requesting node. | `false`     |
| `parser`                           | The parser used to encode/decode messages sent to Valkey.                    | `notepack.io` |

## Run the example

```bash
# 1. start Valkey
docker compose up -d

# 2. build the adapter
npm install
npm run compile

# 3. start two instances on different ports
PORT=3000 node example/index.js
PORT=3001 node example/index.js
```

A message emitted on the instance on port 3000 reaches clients connected to the instance on port 3001, proving cross-server broadcasting through Valkey.

## Tests

```bash
docker compose up -d   # start Valkey on localhost:6379
npm test
```

## License

[MIT](LICENSE)
