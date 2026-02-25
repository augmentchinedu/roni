/**
 * roni/sdk/roni.js
 *
 * The Roni App SDK.
 *
 * This is the ONLY thing an app imports to access Roni OS APIs.
 * It communicates with the compositor via postMessage.
 * The compositor validates the app's token and proxies calls to the kernel.
 *
 * Usage (inside an app iframe):
 *   import { getRoniSDK } from 'http://roni.local/sdk/roni.js'
 *   const roni = await getRoniSDK()
 *
 *   const files = await roni.fs.readdir('/home/user')
 *   await roni.window.setTitle('My App')
 *   await roni.notify({ title: 'Done!', body: 'File saved.' })
 */

// ─── Internals ───────────────────────────────

let _sdk = null;
let _token = null;
let _windowId = null;
const _pending = new Map();

function getToken() {
  if (_token) return _token;
  const params = new URLSearchParams(location.search);
  _token = params.get("token");
  _windowId = params.get("wid");
  return _token;
}

function sendToCompositor(msg) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timer = setTimeout(() => {
      _pending.delete(id);
      reject(new Error(`SDK timeout: ${msg.domain}.${msg.method}`));
    }, 10000);

    _pending.set(id, { resolve, reject, timer });

    parent.postMessage(
      {
        __roni: true,
        id,
        token: getToken(),
        windowId: _windowId,
        type: "request",
        domain: msg.domain,
        method: msg.method,
        payload: msg.payload ?? {},
      },
      "*"
    );
  });
}

// Listen for responses from compositor
window.addEventListener("message", (ev) => {
  const msg = ev.data;
  if (!msg?.__roni || msg.type !== "response") return;
  const pending = _pending.get(msg.id);
  if (!pending) return;
  clearTimeout(pending.timer);
  _pending.delete(msg.id);
  if (msg.error) pending.reject(new Error(msg.error));
  else pending.resolve(msg.payload);
});

// ─── Event system ────────────────────────────

const _listeners = new Map();

window.addEventListener("message", (ev) => {
  const msg = ev.data;
  if (!msg?.__roni || msg.type !== "event") return;
  const fns = _listeners.get(msg.method) ?? [];
  for (const fn of fns) fn(msg.payload);
});

function on(event, fn) {
  if (!_listeners.has(event)) _listeners.set(event, new Set());
  _listeners.get(event).add(fn);
  return () => off(event, fn);
}

function off(event, fn) {
  _listeners.get(event)?.delete(fn);
}

// ─── SDK API ─────────────────────────────────

function makeSDK() {
  return Object.freeze({
    // ── File System ──────────────────────────
    fs: {
      readFile: (path, encoding = "utf8") =>
        sendToCompositor({
          domain: "fs",
          method: "readFile",
          payload: { path, encoding },
        }),
      writeFile: (path, data) =>
        sendToCompositor({
          domain: "fs",
          method: "writeFile",
          payload: { path, data },
        }),
      readdir: (path) =>
        sendToCompositor({
          domain: "fs",
          method: "readdir",
          payload: { path },
        }),
      stat: (path) =>
        sendToCompositor({ domain: "fs", method: "stat", payload: { path } }),
      mkdir: (path, recursive = true) =>
        sendToCompositor({
          domain: "fs",
          method: "mkdir",
          payload: { path, recursive },
        }),
      unlink: (path) =>
        sendToCompositor({ domain: "fs", method: "unlink", payload: { path } }),
      rename: (from, to) =>
        sendToCompositor({
          domain: "fs",
          method: "rename",
          payload: { from, to },
        }),
    },

    // ── Processes ────────────────────────────
    proc: {
      spawn: (cmd, args = [], opts = {}) =>
        sendToCompositor({
          domain: "proc",
          method: "spawn",
          payload: { cmd, args, opts },
        }),
      kill: (pid, signal = "SIGTERM") =>
        sendToCompositor({
          domain: "proc",
          method: "kill",
          payload: { pid, signal },
        }),
    },

    // ── Window ───────────────────────────────
    window: {
      setTitle: (title) =>
        sendToCompositor({
          domain: "window",
          method: "window:setTitle",
          payload: { title },
        }),
      resize: (width, height) =>
        sendToCompositor({
          domain: "window",
          method: "window:resize",
          payload: { width, height },
        }),
      minimize: () =>
        sendToCompositor({
          domain: "window",
          method: "window:minimize",
          payload: {},
        }),
      maximize: () =>
        sendToCompositor({
          domain: "window",
          method: "window:maximize",
          payload: {},
        }),
      close: () =>
        sendToCompositor({
          domain: "window",
          method: "window:close",
          payload: {},
        }),
      focus: () =>
        sendToCompositor({
          domain: "window",
          method: "window:focus",
          payload: {},
        }),
    },

    // ── Notifications ────────────────────────
    notify: ({ title, body, icon, duration = 4000 }) =>
      sendToCompositor({
        domain: "shell",
        method: "notify",
        payload: { title, body, icon, duration },
      }),

    // ── Clipboard ────────────────────────────
    clipboard: {
      read: () =>
        sendToCompositor({
          domain: "shell",
          method: "clipboard:read",
          payload: {},
        }),
      write: (text) =>
        sendToCompositor({
          domain: "shell",
          method: "clipboard:write",
          payload: { text },
        }),
    },

    // ── Events ───────────────────────────────
    on,
    off,
  });
}

// ─── Handshake ───────────────────────────────

export async function getRoniSDK() {
  if (_sdk) return _sdk;

  getToken();
  if (!_token)
    throw new Error(
      "[roni-sdk] No token in URL. Is this running inside a Roni window?"
    );

  // Announce readiness to compositor
  parent.postMessage(
    { __roni: true, type: "handshake", token: _token, windowId: _windowId },
    "*"
  );

  // Wait for compositor ack
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("[roni-sdk] Handshake timeout")),
      5000
    );
    window.addEventListener("message", function handler(ev) {
      if (ev.data?.__roni && ev.data.type === "handshake:ack") {
        clearTimeout(timer);
        window.removeEventListener("message", handler);
        resolve();
      }
    });
  });

  _sdk = makeSDK();
  return _sdk;
}
