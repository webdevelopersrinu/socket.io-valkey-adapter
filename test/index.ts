import { testSuite as commonTestSuite } from "./common";
import { testSuite as specificsTestSuite } from "./specifics";
import { createAdapter, createShardedAdapter } from "../lib";
import Valkey, { Cluster } from "iovalkey";

const clusterNodes = [
  { host: "localhost", port: 7000 },
  { host: "localhost", port: 7001 },
  { host: "localhost", port: 7002 },
  { host: "localhost", port: 7003 },
  { host: "localhost", port: 7004 },
  { host: "localhost", port: 7005 },
];

function testSuite(createAdapter: any, sharded = false) {
  commonTestSuite(createAdapter);
  specificsTestSuite(createAdapter, sharded);
}

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

  describe("iovalkey cluster", () =>
    testSuite(async () => {
      const pubClient = new Cluster(clusterNodes);
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
    }, true));

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
    }, true));

  // Blocked on iovalkey: sharded Pub/Sub on a cluster requires per-node
  // subscriber connections (ioredis added this as `shardedSubscribers: true`
  // in v5.6.0, after iovalkey forked). With a single subscriber connection,
  // SSUBSCRIBE fails with MOVED for channels on other nodes' slots.
  // Re-enable once https://github.com/valkey-io/iovalkey ships the option.
  describe.skip("[sharded] iovalkey cluster", () =>
    testSuite(async () => {
      const pubClient = new Cluster(clusterNodes);
      const subClient = pubClient.duplicate();

      return [
        createShardedAdapter(pubClient, subClient),
        () => {
          pubClient.disconnect();
          subClient.disconnect();
        },
      ];
    }, true));

  import("./custom-parser");
});