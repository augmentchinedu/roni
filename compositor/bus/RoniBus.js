/**
 * roni/compositor/bus/RoniBus.js
 *
 * Compositor-side IPC client.
 * Connects to the kernel's WebSocket bus and provides a clean API
 * for the Vue compositor to talk to the kernel.
 *
 * Usage:
 *   import { bus } from './bus/RoniBus.js'
 *   await bus.connect()
 *   bus.on('session:start', handler)
 *   const result = await bus.request('fs', 'readFile', { path: '/etc/os-release' })
 */

import { reactive } from "vue";
import { randomUUID } from "./uuid.js";

const BUS_PORT = window.__RONI_BUS_PORT__ ?? 7701;
const BUS_URL = `ws://127.0.0.1:${BUS_PORT}`;

class RoniBus extends EventTarget {
  #ws = null;
  #ready = false;
  #queue = [];
  #pending = new Map(); // id → { resolve, reject, timer }
  #listeners = new Map(); // event → Set<fn>

  state = reactive({
    connected: false,
    reconnecting: false,
    error: null,
  });

  async connect() {
    return new Promise((resolve, reject) => {
      this.#ws = new WebSocket(BUS_URL);

      this.#ws.onopen = () => {
        // Perform handshake
        this.#send({
          id: randomUUID(),
          from: "compositor",
          to: "kernel",
          type: "handshake",
        });
      };

      this.#ws.onmessage = ({ data }) => {
        let msg;
        try {
          msg = JSON.parse(data);
        } catch {
          return;
        }

        if (msg.type === "handshake:ack") {
          this.#ready = true;
          this.state.connected = true;
          this.state.reconnecting = false;
          console.log("[bus] Connected to kernel IPC bus");

          // Flush queued messages
          for (const m of this.#queue) this.#send(m);
          this.#queue = [];

          // Announce to kernel that compositor is ready
          this.send({
            to: "kernel",
            type: "event",
            domain: "kernel",
            method: "compositor:ready",
            from: "compositor",
          });

          resolve(this);
          return;
        }

        this.#handle(msg);
      };

      this.#ws.onclose = () => {
        this.#ready = false;
        this.state.connected = false;
        console.warn("[bus] Disconnected from kernel. Reconnecting...");
        this.state.reconnecting = true;
        setTimeout(() => this.connect(), 1000);
      };

      this.#ws.onerror = (err) => {
        this.state.error = "Connection failed";
        console.error("[bus] WebSocket error:", err);
        reject(err);
      };
    });
  }

  // ─── Incoming ────────────────────────────────

  #handle(msg) {
    // Response to a pending request
    if (msg.type === "response" || msg.type === "error") {
      const pending = this.#pending.get(msg.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.#pending.delete(msg.id);
        if (msg.type === "error") pending.reject(new Error(msg.error));
        else pending.resolve(msg.payload);
        return;
      }
    }

    // Named event — dispatch to listeners
    const eventKey = msg.method ?? msg.type;
    const listeners = this.#listeners.get(eventKey);
    if (listeners) {
      for (const fn of listeners) fn(msg.payload, msg);
    }

    // Also dispatch as a domain:method event
    const domainKey = `${msg.domain}:${msg.method}`;
    const domainListeners = this.#listeners.get(domainKey);
    if (domainListeners) {
      for (const fn of domainListeners) fn(msg.payload, msg);
    }
  }

  // ─── Outgoing ─────────────────────────────────

  #send(msg) {
    if (this.#ws?.readyState === WebSocket.OPEN) {
      this.#ws.send(JSON.stringify(msg));
    }
  }

  /**
   * Send a fire-and-forget event to the kernel.
   */
  send(msg) {
    if (!msg.id) msg.id = randomUUID();
    if (!msg.from) msg.from = "compositor";
    if (this.#ready) {
      this.#send(msg);
    } else {
      this.#queue.push(msg);
    }
  }

  /**
   * Send a request to the kernel and await the response.
   */
  request(domain, method, payload = {}, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const id = randomUUID();
      const timer = setTimeout(() => {
        this.#pending.delete(id);
        reject(new Error(`Kernel request timeout: ${domain}.${method}`));
      }, timeoutMs);

      this.#pending.set(id, { resolve, reject, timer });
      this.send({
        id,
        to: "kernel",
        type: "request",
        domain,
        method,
        payload,
      });
    });
  }

  // ─── Event subscription ───────────────────────

  on(event, fn) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    this.#listeners.get(event)?.delete(fn);
  }

  once(event, fn) {
    const wrapper = (...args) => {
      fn(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }
}

// Singleton
export const bus = new RoniBus();
