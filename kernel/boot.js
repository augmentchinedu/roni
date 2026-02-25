/**
 * kernel/boot.js
 *
 * Roni OS kernel entry point.
 * Invoked by Linux init. This is the first Node.js process.
 *
 * Responsibilities:
 *   1. Load system config
 *   2. Start the IPC message bus
 *   3. Initialize hardware services
 *   4. Spawn Chromium (the display layer)
 *   5. Supervise the session — restart or halt on exit
 */

import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Bus } from "./ipc/bus.js";
import { VFS } from "./fs/vfs.js";
import { ProcessManager } from "./proc/manager.js";
import { DisplayService } from "./hw/display.js";
import { PowerService } from "./power/manager.js";
import { SessionService } from "./auth/session.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const IS_DEV = process.argv.includes("--dev");

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────

async function loadConfig() {
  try {
    const raw = await readFile(`${ROOT}/config/system.json`, "utf8");
    return JSON.parse(raw);
  } catch {
    console.warn("[boot] No system.json found, using defaults");
    return {
      display: { platform: "wayland", width: 1920, height: 1080 },
      compositor: { port: 7700 },
      chromium: { bin: "chromium-browser" },
    };
  }
}

// ─────────────────────────────────────────────
// Kernel Services
// ─────────────────────────────────────────────

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
    console.log("[kernel] Starting Roni kernel services...");
    await this.bus.start();
    await this.vfs.start();
    await this.proc.start();
    await this.display.start();
    await this.power.start();
    await this.session.start();
    this.registerHandlers();
    console.log("[kernel] All services started.");
  }

  registerHandlers() {
    // Kernel responds to compositor:ready from display layer
    this.bus.on("compositor:ready", async (msg) => {
      console.log("[kernel] Compositor ready. Sending session info.");
      this.bus.send({
        to: "compositor",
        type: "event",
        domain: "kernel",
        method: "session:start",
        payload: {
          display: await this.display.getInfo(),
          session: await this.session.getCurrent(),
        },
      });
    });

    // Power events from compositor
    this.bus.on("power:shutdown", () => this.power.shutdown());
    this.bus.on("power:reboot", () => this.power.reboot());
    this.bus.on("power:sleep", () => this.power.sleep());

    // Handle uncaught errors gracefully
    process.on("uncaughtException", (err) => {
      console.error("[kernel] Uncaught exception:", err);
    });
  }
}

// ─────────────────────────────────────────────
// Chromium Launcher
// ─────────────────────────────────────────────

function buildChromiumArgs(config, port) {
  const url = IS_DEV
    ? `http://localhost:${config.compositor?.devPort ?? 5173}`
    : `http://localhost:${port}`;

  const args = [
    `--app=${url}`,
    "--start-fullscreen",
    "--disable-infobars",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-translate",
    "--disable-features=TranslateUI",
    "--noerrdialogs",
    "--kiosk",
    // ── Identity flags ──────────────────────────────────────────────────
    // Sets WM_CLASS so any host taskbar (dev mode) groups this window
    // under "Roni" and picks up the Roni.desktop icon — not Chromium's.
    "--class=Roni",
    "--name=Roni",
    // Window title (shown in alt-tab, taskbars that use window name)
    "--window-name=Roni",
  ];

  if (!IS_DEV) {
    // Bare-metal display: tell Chromium to render directly to DRM/Wayland
    const platform = config.display?.platform ?? "wayland";
    args.push(`--ozone-platform=${platform}`);

    if (platform === "drm") {
      // Framebuffer mode — no display server required at all
      args.push("--use-gl=egl");
      args.push("--enable-features=UseOzonePlatform");
    }
  }

  return args;
}

async function spawnChromium(config, port) {
  const bin = config.chromium?.bin ?? "chromium-browser";
  const args = buildChromiumArgs(config, port);

  console.log(
    `[boot] Launching Chromium: ${bin} ${args.slice(0, 2).join(" ")} ...`
  );

  const child = spawn(bin, args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      DISPLAY: process.env.DISPLAY ?? ":0",
    },
    detached: false,
  });

  child.stdout.on("data", (d) => process.stdout.write(`[chromium] ${d}`));
  child.stderr.on("data", (d) => process.stderr.write(`[chromium:err] ${d}`));

  child.on("exit", (code, signal) => {
    console.warn(`[boot] Chromium exited (code=${code} signal=${signal})`);
    if (code !== 0) {
      console.log("[boot] Restarting Chromium in 2s...");
      setTimeout(() => spawnChromium(config, port), 2000);
    } else {
      console.log("[boot] Clean Chromium exit. Halting.");
      process.exit(0);
    }
  });

  return child;
}

// ─────────────────────────────────────────────
// Compositor HTTP Server (serves compositor/ dir)
// ─────────────────────────────────────────────

async function startCompositorServer(config) {
  const { createReadStream } = await import("node:fs");
  const { extname } = await import("node:path");
  const port = config.compositor?.port ?? 7700;
  const compositorRoot = resolve(ROOT, "compositor", "dist");

  const MIME = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".vue": "application/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".json": "application/json",
    ".png": "image/png",
    ".ico": "image/x-icon",
  };

  const server = createServer(async (req, res) => {
    let filePath = resolve(
      compositorRoot,
      "." + (req.url === "/" ? "/index.html" : req.url)
    );
    const ext = extname(filePath);
    const mime = MIME[ext] ?? "application/octet-stream";

    try {
      res.setHeader("Content-Type", mime);
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      createReadStream(filePath).pipe(res);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  await new Promise((resolve, reject) => {
    server.listen(port, "127.0.0.1", resolve);
    server.on("error", reject);
  });

  console.log(`[boot] Compositor server: http://localhost:${port}`);
  return port;
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function main() {
  // Rename the Node process — shows as 'Roni' in ps, top, and taskbars
  process.title = "Roni";

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Roni OS — Booting");
  console.log(`  Node ${process.version} · ESM · ${IS_DEV ? "DEV" : "PROD"}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const config = await loadConfig();

  // Start kernel services (IPC bus first)
  const kernel = new KernelServices(config);
  await kernel.start();

  // Serve compositor (in prod; dev uses Vite)
  let port = config.compositor?.port ?? 7700;
  if (!IS_DEV) {
    port = await startCompositorServer(config);
  }

  // Launch Chromium
  if (!IS_DEV) {
    await spawnChromium(config, port);
  } else {
    console.log(
      "[boot] DEV mode — skipping Chromium. Open http://localhost:5173 in your browser."
    );
  }
}

main().catch((err) => {
  console.error("[boot] Fatal error during boot:", err);
  process.exit(1);
});
