/**
 * kernel/boot.js — SEA-SAFE Roni OS kernel entry
 */

console.log(">>> Roni SEA boot starting...");

import { readFile, createReadStream, existsSync } from "node:fs";
import { spawn, execSync } from "node:child_process";
import { createServer } from "node:http";
import { resolve, dirname, join, extname } from "node:path";

import { Bus } from "./ipc/bus.js";
import { VFS } from "./fs/vfs.js";
import { ProcessManager } from "./proc/manager.js";
import { DisplayService } from "./hw/display.js";
import { PowerService } from "./power/manager.js";
import { SessionService } from "./auth/session.js";

/* ───────────────────────────────────────────────────────────── */
/* SEA-SAFE ROOT RESOLUTION                                      */
/* ───────────────────────────────────────────────────────────── */

const ROOT = dirname(process.execPath);
const IS_DEV = process.argv.includes("--dev");

/* ───────────────────────────────────────────────────────────── */
/* CONFIG LOADER                                                 */
/* ───────────────────────────────────────────────────────────── */

async function loadConfig() {
  try {
    const raw = await readFile(resolve(ROOT, "config", "system.json"), "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.warn("[boot] No system.json found. Using defaults.");
    return {
      display: { platform: "wayland", width: 1920, height: 1080 },
      compositor: { port: 7700 },
      chromium: {}
    };
  }
}

/* ───────────────────────────────────────────────────────────── */
/* KERNEL SERVICES                                               */
/* ───────────────────────────────────────────────────────────── */

class KernelServices {
  constructor(config) {
    this.config = config;
    this.bus = new Bus(config);
    this.vfs = new VFS(config);
    this.proc = new ProcessManager(config, this.bus);
    this.display = new DisplayService(config, this.bus);
    this.power = new PowerService(config, this.bus);
    this.session = new SessionService(config, this.bus);
  }

  async start() {
    console.log("[kernel] Starting services...");
    await this.bus.start();
    await this.vfs.start();
    await this.proc.start();
    await this.display.start();
    await this.power.start();
    await this.session.start();
    console.log("[kernel] Services ready.");
  }
}

/* ───────────────────────────────────────────────────────────── */
/* CHROMIUM DETECTION                                            */
/* ───────────────────────────────────────────────────────────── */

function findChromium(config) {
  if (config.chromium?.bin) return config.chromium.bin;

  const candidates = process.platform === "win32"
    ? [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
      ]
    : process.platform === "darwin"
    ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
    : ["chromium-browser", "chromium", "google-chrome"];

  for (const c of candidates) {
    try {
      if (c.includes("\\") || c.includes("/")) {
        if (existsSync(c)) return c;
      } else {
        execSync(process.platform === "win32" ? `where "${c}"` : `which "${c}"`);
        return c;
      }
    } catch {}
  }

  return null;
}

function buildChromiumArgs(port) {
  const url = `http://localhost:${port}`;
  return [
    `--app=${url}`,
    "--kiosk",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-infobars"
  ];
}

function spawnChromium(config, port) {
  const bin = findChromium(config);

  if (!bin) {
    console.error("[boot] Chromium not found.");
    process.exit(1);
  }

  console.log("[boot] Launching Chromium...");

  const child = spawn(bin, buildChromiumArgs(port), {
    windowsHide: false
  });

  child.on("exit", (code) => {
    console.warn(`[boot] Chromium exited (${code})`);
  });

  child.on("error", (err) => {
    console.error("[boot] Chromium failed:", err.message);
  });
}

/* ───────────────────────────────────────────────────────────── */
/* COMPOSITOR SERVER                                             */
/* ───────────────────────────────────────────────────────────── */

async function startCompositorServer(config) {
  const port = config.compositor?.port ?? 7700;
  const root = resolve(ROOT, "compositor", "dist");

  if (!existsSync(root)) {
    console.error("[boot] compositor/dist not found.");
    process.exit(1);
  }

  const MIME = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".json": "application/json",
    ".png": "image/png",
    ".ico": "image/x-icon"
  };

  const server = createServer((req, res) => {
    const path = req.url === "/" ? "/index.html" : req.url.split("?")[0];
    const file = join(root, path);

    const ext = extname(file);
    res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");

    const stream = createReadStream(file);

    stream.on("error", () => {
      const fallback = createReadStream(join(root, "index.html"));
      fallback.pipe(res);
    });

    stream.pipe(res);
  });

  await new Promise((resolve, reject) => {
    server.listen(port, "127.0.0.1", resolve);
    server.on("error", reject);
  });

  console.log(`[boot] Compositor running at http://localhost:${port}`);
  return port;
}

/* ───────────────────────────────────────────────────────────── */
/* MAIN                                                          */
/* ───────────────────────────────────────────────────────────── */

async function main() {
  process.title = "Roni";

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Roni OS — SEA Boot");
  console.log(`Node ${process.version}`);
  console.log(`ROOT: ${ROOT}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const config = await loadConfig();

  const kernel = new KernelServices(config);
  await kernel.start();

  const port = await startCompositorServer(config);

  spawnChromium(config, port);

  // CRITICAL: keep SEA process alive
  process.stdin.resume();
}

main().catch((err) => {
  console.error("[boot] Fatal:", err);
  process.exit(1);
});