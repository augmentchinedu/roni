/**
 * roni/kernel/proc/manager.js
 */
import { spawn } from "node:child_process";

export class ProcessManager {
  #procs = new Map();
  #bus = null;

  constructor(config, bus) {
    this.#bus = bus;
  }

  async start() {
    this.#bus.handle("proc", "spawn", ({ cmd, args, opts }) => {
      const child = spawn(cmd, args ?? [], { shell: false, ...opts });
      const pid = child.pid;
      this.#procs.set(pid, child);
      child.on("exit", () => this.#procs.delete(pid));
      return { pid };
    });
    this.#bus.handle("proc", "kill", ({ pid, signal }) => {
      const child = this.#procs.get(pid);
      if (child) child.kill(signal ?? "SIGTERM");
      return { ok: true };
    });
    this.#bus.handle("proc", "list", () =>
      [...this.#procs.keys()].map((pid) => ({ pid }))
    );
    console.log("[proc] Process manager started");
  }
}

/**
 * roni/kernel/hw/display.js
 */
export class DisplayService {
  #config = null;
  #bus = null;

  constructor(config, bus) {
    this.#config = config;
    this.#bus = bus;
  }

  async start() {
    this.#bus.handle("hw", "getDisplay", () => this.getInfo());
    console.log("[hw] Display service started");
  }

  getInfo() {
    return {
      width: this.#config.display?.width ?? 1920,
      height: this.#config.display?.height ?? 1080,
      dpi: this.#config.display?.dpi ?? 96,
      scale: this.#config.display?.scale ?? 1,
      platform: this.#config.display?.platform ?? "wayland",
    };
  }
}

/**
 * roni/kernel/power/manager.js
 */
import { execSync } from "node:child_process";

export class PowerService {
  #bus = null;

  constructor(config, bus) {
    this.#bus = bus;
  }

  async start() {
    console.log("[power] Power service started");
  }

  shutdown() {
    execSync("shutdown now");
  }
  reboot() {
    execSync("reboot");
  }
  sleep() {
    execSync("systemctl suspend");
  }
}

/**
 * roni/kernel/auth/session.js
 */
import { randomUUID } from "node:crypto";

export class SessionService {
  #bus = null;
  #tokens = new Map();

  constructor(config, bus) {
    this.#bus = bus;
  }

  async start() {
    this.#bus.handle("auth", "issueToken", ({ windowId, permissions }) => {
      const token = randomUUID();
      this.#tokens.set(token, { windowId, permissions, issued: Date.now() });
      return { token };
    });
    this.#bus.handle("auth", "validateToken", ({ token }) => {
      return this.#tokens.get(token) ?? null;
    });
    console.log("[auth] Session service started");
  }

  getCurrent() {
    return { user: "user", home: "/home/user", shell: "/roni/apps/terminal" };
  }
}
