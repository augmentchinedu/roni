/**
 * roni/compositor/bus/useKernel.js
 *
 * Vue composable — clean API for kernel calls inside Vue components.
 *
 * Usage:
 *   const { fs, proc, hw, power } = useKernel()
 *   const contents = await fs.readFile('/etc/roni/version')
 *   const { pid } = await proc.spawn('ls', ['-la'])
 */

import { bus } from "./RoniBus.js";

// ─── Domain builders ─────────────────────────

function domain(name) {
  return new Proxy(
    {},
    {
      get(_, method) {
        return (payload = {}) => bus.request(name, method, payload);
      },
    }
  );
}

// ─── Typed domains ───────────────────────────

export const kernelFS = {
  readFile: (path, encoding = "utf8") =>
    bus.request("fs", "readFile", { path, encoding }),
  writeFile: (path, data) => bus.request("fs", "writeFile", { path, data }),
  readdir: (path) => bus.request("fs", "readdir", { path }),
  stat: (path) => bus.request("fs", "stat", { path }),
  mkdir: (path, recursive = true) =>
    bus.request("fs", "mkdir", { path, recursive }),
  unlink: (path) => bus.request("fs", "unlink", { path }),
  rename: (from, to) => bus.request("fs", "rename", { from, to }),
  watch: (path, callback) => {
    const id = crypto.randomUUID();
    bus.send({
      to: "kernel",
      type: "request",
      domain: "fs",
      method: "watch",
      payload: { path, id },
    });
    return bus.on(`fs:watch:${id}`, callback);
  },
};

export const kernelProc = {
  spawn: (cmd, args = [], opts = {}) =>
    bus.request("proc", "spawn", { cmd, args, opts }),
  kill: (pid, signal = "SIGTERM") =>
    bus.request("proc", "kill", { pid, signal }),
  list: () => bus.request("proc", "list", {}),
};

export const kernelHW = {
  getDisplay: () => bus.request("hw", "getDisplay", {}),
  getBattery: () => bus.request("hw", "getBattery", {}),
  getNetwork: () => bus.request("hw", "getNetwork", {}),
  getAudio: () => bus.request("hw", "getAudio", {}),
};

export const kernelPower = {
  shutdown: () =>
    bus.send({
      to: "kernel",
      type: "event",
      domain: "power",
      method: "shutdown",
      payload: {},
    }),
  reboot: () =>
    bus.send({
      to: "kernel",
      type: "event",
      domain: "power",
      method: "reboot",
      payload: {},
    }),
  sleep: () =>
    bus.send({
      to: "kernel",
      type: "event",
      domain: "power",
      method: "sleep",
      payload: {},
    }),
};

// ─── Vue composable ──────────────────────────

export function useKernel() {
  return {
    bus,
    fs: kernelFS,
    proc: kernelProc,
    hw: kernelHW,
    power: kernelPower,
    // Escape hatch for unlisted methods
    raw: domain,
  };
}
