/**
 * roni/kernel/ipc/bus.js
 *
 * The Roni IPC Message Bus.
 *
 * Runs in Node as a WebSocket server.
 * Chromium connects via WebSocket from the compositor.
 * Apps never touch this directly — they go through the SDK → compositor → bus.
 *
 * Protocol: NDJSON envelopes over WebSocket.
 *
 * Message Envelope:
 * {
 *   id: string,           // UUIDv4 — for request/response correlation
 *   from: string,         // 'kernel' | 'compositor' | 'app:{app-id}'
 *   to: string,           // 'kernel' | 'compositor' | 'app:{app-id}' | '*'
 *   type: string,         // 'request' | 'response' | 'event' | 'error'
 *   domain: string,       // 'fs' | 'proc' | 'hw' | 'net' | 'power' | 'auth' | 'kernel'
 *   method: string,       // e.g. 'readFile', 'spawn', 'session:start'
 *   payload: object,      // method arguments or response data
 *   token?: string,       // capability token (app calls only)
 *   error?: string,       // error message (type=error only)
 * }
 */

import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";

export class Bus extends EventEmitter {
  #wss = null;
  #clients = new Map(); // name → WebSocket
  #handlers = new Map(); // method → handler fn
  #config = null;
  #port = null;

  constructor(config) {
    super();
    this.#config = config;
    this.#port = config.ipc?.port ?? 7701;
  }

  async start() {
    this.#wss = new WebSocketServer({
      host: "127.0.0.1",
      port: this.#port,
    });

    this.#wss.on("connection", (ws, req) => {
      let clientName = null;

      ws.on("message", (raw) => {
        let msg;
        try {
          msg = JSON.parse(raw.toString());
        } catch {
          console.warn(
            "[bus] Malformed message:",
            raw.toString().slice(0, 100)
          );
          return;
        }

        // First message must be a handshake
        if (!clientName) {
          if (msg.type === "handshake") {
            clientName = msg.from;
            this.#clients.set(clientName, ws);
            console.log(`[bus] Client connected: ${clientName}`);
            ws.send(
              JSON.stringify({
                id: randomUUID(),
                from: "kernel",
                to: clientName,
                type: "handshake:ack",
                payload: { port: this.#port },
              })
            );
          }
          return;
        }

        msg.from = clientName; // enforce — clients can't spoof from
        this.#route(msg, ws);
      });

      ws.on("close", () => {
        if (clientName) {
          this.#clients.delete(clientName);
          console.log(`[bus] Client disconnected: ${clientName}`);
          this.emit("client:disconnect", clientName);
        }
      });

      ws.on("error", (err) => {
        console.error(`[bus] WebSocket error (${clientName}):`, err.message);
      });
    });

    await new Promise((resolve) => this.#wss.on("listening", resolve));
    console.log(`[bus] IPC bus listening on ws://127.0.0.1:${this.#port}`);
  }

  // ─── Routing ─────────────────────────────────

  #route(msg, senderWs) {
    // Broadcast
    if (msg.to === "*") {
      this.#broadcast(msg, senderWs);
      return;
    }

    // To kernel — dispatch to registered handler
    if (msg.to === "kernel") {
      this.#dispatch(msg);
      return;
    }

    // To a specific client — forward
    const target = this.#clients.get(msg.to);
    if (target && target.readyState === WebSocket.OPEN) {
      target.send(JSON.stringify(msg));
    } else {
      this.#sendError(senderWs, msg, `No client '${msg.to}' connected`);
    }
  }

  #broadcast(msg, excludeWs) {
    const raw = JSON.stringify(msg);
    for (const [, ws] of this.#clients) {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        ws.send(raw);
      }
    }
  }

  #dispatch(msg) {
    // First emit as a named event (e.g. 'compositor:ready')
    const eventName = `${msg.from}:${msg.method}`;
    this.emit(eventName, msg);

    // Also emit as a domain:method event
    const domainEvent = `${msg.domain}:${msg.method}`;
    this.emit(domainEvent, msg);

    // Generic handler lookup
    const key = `${msg.domain}.${msg.method}`;
    const handler = this.#handlers.get(key);
    if (handler) {
      Promise.resolve(handler(msg.payload, msg))
        .then((result) => {
          if (msg.type === "request") {
            this.#respond(msg, result);
          }
        })
        .catch((err) => {
          const senderWs = this.#clients.get(msg.from);
          if (senderWs) this.#sendError(senderWs, msg, err.message);
        });
    }
  }

  // ─── Public API ──────────────────────────────

  /**
   * Register a handler for a domain.method combination.
   * Called by kernel services to expose their API.
   */
  handle(domain, method, fn) {
    this.#handlers.set(`${domain}.${method}`, fn);
  }

  /**
   * Send a message from the kernel to a client.
   */
  send(msg) {
    if (!msg.id) msg.id = randomUUID();
    if (!msg.from) msg.from = "kernel";

    const target = this.#clients.get(msg.to);
    if (target && target.readyState === WebSocket.OPEN) {
      target.send(JSON.stringify(msg));
    } else if (msg.to === "*") {
      this.#broadcast(msg, null);
    } else {
      console.warn(`[bus] send failed — no client '${msg.to}'`);
    }
  }

  /**
   * Make a request from kernel to a client and await response.
   */
  request(to, domain, method, payload, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const id = randomUUID();
      const timer = setTimeout(() => {
        this.off(`response:${id}`, handler);
        reject(new Error(`[bus] Request timeout: ${domain}.${method}`));
      }, timeoutMs);

      const handler = (msg) => {
        clearTimeout(timer);
        if (msg.type === "error") reject(new Error(msg.error));
        else resolve(msg.payload);
      };

      this.once(`response:${id}`, handler);
      this.send({ id, to, type: "request", domain, method, payload });
    });
  }

  #respond(originalMsg, payload) {
    this.send({
      id: originalMsg.id,
      to: originalMsg.from,
      type: "response",
      domain: originalMsg.domain,
      method: originalMsg.method,
      payload,
    });
    // Also emit locally so kernel-side request() can resolve
    this.emit(`response:${originalMsg.id}`, { type: "response", payload });
  }

  #sendError(ws, originalMsg, error) {
    ws.send(
      JSON.stringify({
        id: originalMsg.id,
        from: "kernel",
        to: originalMsg.from,
        type: "error",
        domain: originalMsg.domain,
        method: originalMsg.method,
        error,
      })
    );
  }

  get port() {
    return this.#port;
  }
}
