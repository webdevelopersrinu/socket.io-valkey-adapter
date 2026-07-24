import type { Server, Socket as ServerSocket } from "socket.io";
import type { Socket as ClientSocket } from "socket.io-client";
import expect = require("expect.js");
import { shouldNotHappen, setup } from "./util";
import type { ValkeyAdapter } from "../lib";

/**
 * Adapter-specific tests, ported from the official Socket.IO Redis adapter.
 * Only the event-based client API (iovalkey) branches are kept.
 */
export function testSuite(createAdapter: any, sharded: boolean = false) {
  describe("specifics", () => {
    let servers: Server[];
    let serverSockets: ServerSocket[];
    let clientSockets: ClientSocket[];
    let cleanup: () => void;

    beforeEach(async () => {
      const testContext = await setup(createAdapter);
      servers = testContext.servers;
      serverSockets = testContext.serverSockets;
      clientSockets = testContext.clientSockets;
      cleanup = testContext.cleanup;
    });

    afterEach(() => cleanup());

    describe("broadcast", function () {
      it("broadcasts to a numeric room", function (done) {
        if (sharded) {
          return this.skip();
        }
        // @ts-ignore
        serverSockets[0].join(123);

        clientSockets[0].on("test", () => done());
        clientSockets[1].on("test", shouldNotHappen(done));
        clientSockets[2].on("test", shouldNotHappen(done));

        // @ts-ignore
        servers[1].to(123).emit("test");
      });
    });

    it("ignores messages from unknown channels", (done) => {
      (servers[0].of("/").adapter as ValkeyAdapter).subClient.psubscribe(
        "f?o",
        () => {
          (servers[2].of("/").adapter as ValkeyAdapter).pubClient.publish(
            "foo",
            "bar"
          );
        }
      );

      (servers[0].of("/").adapter as ValkeyAdapter).subClient.on(
        "pmessageBuffer",
        () => {
          setTimeout(done, 50);
        }
      );
    });

    it("ignores messages from unknown channels (2)", (done) => {
      (servers[0].of("/").adapter as ValkeyAdapter).subClient.subscribe(
        "woot",
        () => {
          (servers[2].of("/").adapter as ValkeyAdapter).pubClient.publish(
            "woot",
            "toow"
          );
        }
      );

      (servers[0].of("/").adapter as ValkeyAdapter).subClient.on(
        "messageBuffer",
        () => {
          setTimeout(done, 50);
        }
      );
    });

    describe("allRooms", () => {
      afterEach(() => {
        // @ts-ignore
        expect(servers[0].of("/").adapter.requests.size).to.eql(0);
      });

      it("returns all rooms across several nodes", async function () {
        if (sharded) {
          return this.skip();
        }
        serverSockets[0].join("woot1");

        const rooms = await (
          servers[0].of("/").adapter as ValkeyAdapter
        ).allRooms();

        expect(rooms).to.be.a(Set);
        expect(rooms.size).to.eql(4);
        expect(rooms.has(serverSockets[0].id)).to.be(true);
        expect(rooms.has(serverSockets[1].id)).to.be(true);
        expect(rooms.has(serverSockets[2].id)).to.be(true);
        expect(rooms.has("woot1")).to.be(true);
      });
    });
  });
}