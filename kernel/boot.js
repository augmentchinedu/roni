/**
 * kernel/boot.js — Roni OS kernel entry point (Polished)
 */

import {
  readFileSync,
  existsSync,
  createReadStream,
  openSync,
  closeSync,
  unlinkSync,
} from "node:fs";
import { spawn, execSync } from "node:child_process";
import { createServer } from "node:http";
import { resolve, dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

import { createTray } from "./tray.js";

import { Bus } from "./ipc/bus.js";
import { VFS } from "./fs/vfs.js";
import { ProcessManager } from "./proc/manager.js";
import { DisplayService } from "./hw/display.js";
import { PowerService } from "./power/manager.js";
import { SessionService } from "./auth/session.js";
import { compositorFiles as EMBEDDED_COMPOSITOR } from "roni:compositor";

/* ─────────────────────────────────────────────── */
/* FLAGS & ROOT                                   */
/* ─────────────────────────────────────────────── */

const FLAGS = {
  isDev: process.argv.includes("--dev"),
  isBackground: process.argv.includes("--background"),
  isNodeBinary: /(^|[\/])node(\.exe)?$/i.test(process.execPath),
};

const IS_SEA =
  !FLAGS.isDev && !FLAGS.isNodeBinary && process.argv[0] === process.execPath;

let ROOT = IS_SEA
  ? dirname(resolve(process.execPath))
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");

const RUNTIME = {
  chromium: null,
  instanceLockFd: null,
  currentPort: null,
};
/* ─────────────────────────────────────────────── */
/* SINGLE INSTANCE LOCK                           */
/* ─────────────────────────────────────────────── */

function acquireInstanceLock() {
  const lockPath = join(ROOT, ".roni.lock");
  try {
    RUNTIME.instanceLockFd = openSync(lockPath, "wx");
  } catch {
    console.error("[boot] Another Roni instance is already running.");
    process.exit(0);
  }

  process.on("exit", () => {
    try {
      closeSync(RUNTIME.instanceLockFd);
      unlinkSync(lockPath);
    } catch {}
  });
}

/* ─────────────────────────────────────────────── */
/* CONFIG                                         */
/* ─────────────────────────────────────────────── */

function loadConfig() {
  try {
    return JSON.parse(
      readFileSync(join(ROOT, "config", "system.json"), "utf8")
    );
  } catch {
    console.warn("[boot] No system.json — using defaults");
    return {
      display: { platform: "wayland", width: 1920, height: 1080 },
      compositor: { port: 7700 },
      chromium: {},
    };
  }
}

/* ─────────────────────────────────────────────── */
/* KERNEL SERVICES                                */
/* ─────────────────────────────────────────────── */

class KernelServices {
  constructor(config) {
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
    console.log("[kernel] All services started.");
  }
}

/* ─────────────────────────────────────────────── */
/* CHROMIUM                                       */
/* ─────────────────────────────────────────────── */

const CHROMIUM_CANDIDATES = {
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ],
  darwin: ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"],
  linux: ["google-chrome", "chromium", "chromium-browser"],
};

function findChromium(config) {
  if (config.chromium?.bin) return config.chromium.bin;

  const list =
    CHROMIUM_CANDIDATES[process.platform] ?? CHROMIUM_CANDIDATES.linux;

  for (const c of list) {
    try {
      if (existsSync(c)) return c;
      execSync(process.platform === "win32" ? `where "${c}"` : `which "${c}"`, {
        stdio: "ignore",
      });
      return c;
    } catch {}
  }
  return null;
}

function spawnChromium(config, port) {
  const bin = findChromium(config);
  if (!bin) {
    console.error("[boot] Chrome not found.");
    process.exit(1);
  }

  RUNTIME.currentPort = port;

  const userDataDir = join(ROOT, ".roni-profile");

  const args = [
    `--app=http://localhost:${port}`,
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--disable-extensions",
    "--disable-infobars",
  ];

  if (!FLAGS.isDev) args.push("--kiosk");

  if (process.platform === "win32")
    args.push("--no-sandbox", "--disable-gpu-sandbox");

  const child = spawn(bin, args, {
    stdio: "ignore",
    windowsHide: true,
  });

  child.unref();

  RUNTIME.chromium = child;

  child.on("exit", () => {
    RUNTIME.chromium = null;
  });

  return child;
}

function showChromium(config) {
  if (RUNTIME.chromium) return;
  if (!RUNTIME.currentPort) return;

  RUNTIME.chromium = spawnChromium(config, RUNTIME.currentPort);
}

function hideChromium() {
  if (!RUNTIME.chromium) return;

  try {
    RUNTIME.chromium.kill();
  } catch {}

  RUNTIME.chromium = null;
}

/* ─────────────────────────────────────────────── */
/* COMPOSITOR SERVER                              */
/* ─────────────────────────────────────────────── */

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function startCompositorServer(config) {
  const port = config.compositor?.port ?? 7700;
  const root = join(ROOT, "compositor", "dist");

  const server = createServer((req, res) => {
    const urlPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];

    if (EMBEDDED_COMPOSITOR) {
      const data =
        EMBEDDED_COMPOSITOR[urlPath] ?? EMBEDDED_COMPOSITOR["/index.html"];
      res.writeHead(200, {
        "Content-Type": MIME[extname(urlPath)] ?? "text/html",
      });
      res.end(data);
      return;
    }

    const filePath = join(root, urlPath);
    const stream = createReadStream(filePath);
    stream.on("error", () =>
      createReadStream(join(root, "index.html")).pipe(res)
    );
    stream.pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      console.log(`[boot] Compositor: http://localhost:${port}`);
      resolve(port);
    });
  });
}

/* ─────────────────────────────────────────────── */
/* MAIN                                           */
/* ─────────────────────────────────────────────── */

async function main() {
  process.title = "Roni";

  acquireInstanceLock();

  const config = loadConfig();
  const kernel = new KernelServices(config);
  await kernel.start();

  let port = config.compositor?.port ?? 7700;

  if (!FLAGS.isDev) {
    port = await startCompositorServer(config);
  }

  if (!FLAGS.isBackground) {
    RUNTIME.chromium = spawnChromium(config, port);
  }

  // ✅ Create tray on all platforms
  createTray({
    onShow: () => showChromium(config),
    onHide: () => hideChromium(),
    onExit: () => process.exit(0),
  });

  setInterval(() => {}, 1 << 30);
}

main().catch((err) => {
  console.error("[boot] Fatal:", err);
  process.exit(1);
});
