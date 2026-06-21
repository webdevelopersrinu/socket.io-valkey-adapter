import { testSuite } from "./common";
import { createAdapter, createShardedAdapter } from "../lib";
import Valkey from "iovalkey";

describe("@socket.io/valkey-adapter", () => {
  describe("iovalkey standalone", () =>
    testSuite(async () => {
      const pubClient = new Valkey();
      const subClient = pubClient.duplicate();

      return [
        createAdapter(pubClient, subClient, {
          requestsTimeout: 1000,
        }),
        () => {
          pubClient.disconnect();
          subClient.disconnect();
        },
      ];
    }));

  describe("iovalkey standalone (specific response channel)", () =>
    testSuite(async () => {
      const pubClient = new Valkey();
      const subClient = pubClient.duplicate();

      return [
        createAdapter(pubClient, subClient, {
          requestsTimeout: 1000,
          publishOnSpecificResponseChannel: true,
        }),
        () => {
          pubClient.disconnect();
          subClient.disconnect();
        },
      ];
    }));

  describe("[sharded] iovalkey standalone (dynamic subscription mode)", () =>
    testSuite(async () => {
      const pubClient = new Valkey();
      const subClient = pubClient.duplicate();

      return [
        createShardedAdapter(pubClient, subClient, {
          subscriptionMode: "dynamic",
        }),
        () => {
          pubClient.disconnect();
          subClient.disconnect();
        },
      ];
    }));

  describe("[sharded] iovalkey standalone (static subscription mode)", () =>
    testSuite(async () => {
      const pubClient = new Valkey();
      const subClient = pubClient.duplicate();

      return [
        createShardedAdapter(pubClient, subClient, {
          subscriptionMode: "static",
        }),
        () => {
          pubClient.disconnect();
          subClient.disconnect();
        },
      ];
    }));
});
