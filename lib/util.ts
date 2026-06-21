export function hasBinary(obj: any, toJSON?: boolean): boolean {
  if (!obj || typeof obj !== "object") {
    return false;
  }

  if (obj instanceof ArrayBuffer || ArrayBuffer.isView(obj)) {
    return true;
  }

  if (Array.isArray(obj)) {
    for (let i = 0, l = obj.length; i < l; i++) {
      if (hasBinary(obj[i])) {
        return true;
      }
    }
    return false;
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
      return true;
    }
  }

  if (obj.toJSON && typeof obj.toJSON === "function" && !toJSON) {
    return hasBinary(obj.toJSON(), true);
  }

  return false;
}

export function parseNumSubResponse(res) {
  return parseInt(res[1], 10);
}

export function sumValues(values) {
  return values.reduce((acc, val) => {
    return acc + val;
  }, 0);
}

const RETURN_BUFFERS = true;

/**
 * Whether the client uses the callback-based Pub/Sub API (camelCase methods such
 * as `sSubscribe`), as opposed to the event-based API (`ssubscribe` +
 * `smessageBuffer` events) exposed by `iovalkey`.
 *
 * @param client
 */
function usesCallbackApi(client: any) {
  return typeof client.sSubscribe === "function";
}

const kHandlers = Symbol("handlers");

export function SSUBSCRIBE(
  client: any,
  channel: string,
  handler: (rawMessage: Buffer, channel: Buffer) => void
) {
  if (usesCallbackApi(client)) {
    client.sSubscribe(channel, handler, RETURN_BUFFERS);
  } else {
    if (!client[kHandlers]) {
      client[kHandlers] = new Map();
      client.on("smessageBuffer", (rawChannel, message) => {
        client[kHandlers].get(rawChannel.toString())?.(message, rawChannel);
      });
    }
    client[kHandlers].set(channel, handler);
    client.ssubscribe(channel);
  }
}

export function SUNSUBSCRIBE(client: any, channel: string | string[]) {
  if (usesCallbackApi(client)) {
    client.sUnsubscribe(channel);
  } else {
    client.sunsubscribe(channel);
    if (Array.isArray(channel)) {
      channel.forEach((c) => client[kHandlers].delete(c));
    } else {
      client[kHandlers].delete(channel);
    }
  }
}

/**
 * @see https://valkey.io/commands/spublish/
 */
export function SPUBLISH(
  client: any,
  channel: string,
  payload: string | Uint8Array
) {
  if (usesCallbackApi(client)) {
    return client.sPublish(channel, payload);
  } else {
    return client.spublish(channel, payload);
  }
}

export function PUBSUB(client: any, arg: string, channel: string) {
  if (client.constructor.name === "Cluster" || client.isCluster) {
    // iovalkey cluster
    return Promise.all(
      client.nodes().map((node) => {
        return node
          .send_command("PUBSUB", [arg, channel])
          .then(parseNumSubResponse);
      })
    ).then(sumValues);
  } else if (usesCallbackApi(client)) {
    const isCluster = Array.isArray(client.masters);
    if (isCluster) {
      // callback-based cluster client
      const nodes = client.masters;
      return Promise.all(
        nodes.map((node) => {
          return node.client
            .sendCommand(["PUBSUB", arg, channel])
            .then(parseNumSubResponse);
        })
      ).then(sumValues);
    } else {
      // callback-based standalone client
      return client
        .sendCommand(["PUBSUB", arg, channel])
        .then(parseNumSubResponse);
    }
  } else {
    // iovalkey standalone
    return new Promise((resolve, reject) => {
      client.send_command("PUBSUB", [arg, channel], (err, numSub) => {
        if (err) return reject(err);
        resolve(parseNumSubResponse(numSub));
      });
    });
  }
}
