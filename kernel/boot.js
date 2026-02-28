/**
 * kernel/boot.js — Roni OS kernel entry point.
 */

import {
  readFileSync,
  existsSync,
  createReadStream,
} from "node:fs";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { resolve, dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { Bus } from "./ipc/bus.js";
import { VFS } from "./fs/vfs.js";
import { ProcessManager } from "./proc/manager.js";
import { DisplayService } from "./hw/display.js";
import { PowerService } from "./power/manager.js";
import { SessionService } from "./auth/session.js";
import { compositorFiles as EMBEDDED_COMPOSITOR } from "roni:compositor";

// ── ROOT resolution ───────────────────────────────────────────────────────────
const FLAGS = {
  isDev: process.argv.includes("--dev"),
  isBackground: process.env.RONI_BACKGROUND === "1",
  isNodeBinary: /(^|[\/])node(\.exe)?$/i.test(process.execPath),
};
const IS_SEA =
  !FLAGS.isDev && !FLAGS.isNodeBinary && process.argv[0] === process.execPath;

let ROOT;
const RUNTIME = { chromium: null };

if (IS_SEA) {
  ROOT = dirname(resolve(process.execPath));
} else {
  // Dev: kernel/boot.js → go up one level to project root
  ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
}

function relaunchBackgroundIfNeeded() {
  const shouldRelaunch = IS_SEA && !FLAGS.isDev && !FLAGS.isBackground;

  if (!shouldRelaunch) return;

  const child = spawn(process.execPath, process.argv.slice(1), {
    detached: true,
    stdio: "ignore",
    windowsHide: process.platform === "win32",
    env: {
      ...process.env,
      RONI_BACKGROUND: "1",
    },
  });

  child.unref();
  process.exit(0);
}

relaunchBackgroundIfNeeded();

async function startSystemTrayIfAvailable(runtime) {
  if (FLAGS.isDev) return null;

  try {
    const { SysTray } = await import("node-systray");
    const trayIcon =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+AP9KobjigAAAABJRU5ErkJggg==";

    const systray = new SysTray({
      menu: {
        icon: trayIcon,
        title: "Roni",
        tooltip: "Roni OS",
        items: [
          { title: "Restart Chromium", tooltip: "Restart Chromium", enabled: true },
          { title: "Quit Roni", tooltip: "Quit", enabled: true },
        ],
      },
      debug: false,
      copyDir: true,
    });

    systray.onClick(({ item }) => {
      if (!item?.title) return;
      if (item.title === "Restart Chromium" && runtime.chromium) {
        runtime.chromium.kill();
        return;
      }
      if (item.title === "Quit Roni") {
        process.exit(0);
      }
    });

    return systray;
  } catch (err) {
    console.warn(`[boot] node-systray unavailable: ${err.message}`);
    return null;
  }
}

// ── Config ────────────────────────────────────────────────────────────────────

function loadConfig() {
  try {
    const raw = readFileSync(join(ROOT, "config", "system.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    console.warn("[boot] No system.json — using defaults");
    return {
      display: { platform: "wayland", width: 1920, height: 1080 },
      compositor: { port: 7700 },
      chromium: {},
    };
  }
}

// ── Kernel Services ───────────────────────────────────────────────────────────

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
    this.registerHandlers();
    console.log("[kernel] All services started.");
  }

  registerHandlers() {
    this.bus.on("compositor:ready", async () => {
      console.log("[kernel] Compositor ready.");
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
    this.bus.on("power:shutdown", () => this.power.shutdown());
    this.bus.on("power:reboot", () => this.power.reboot());
    this.bus.on("power:sleep", () => this.power.sleep());
    process.on("uncaughtException", (err) => {
      console.error("[kernel] Uncaught exception:", err.message);
    });
  }
}

// ── Chromium detection ────────────────────────────────────────────────────────

const CHROMIUM_CANDIDATES = {
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    join(
      process.env.LOCALAPPDATA ?? "",
      "Google\\Chrome\\Application\\chrome.exe"
    ),
    join(process.env.LOCALAPPDATA ?? "", "Chromium\\Application\\chrome.exe"),
  ],
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ],
  linux: [
    "chromium-browser",
    "chromium",
    "google-chrome",
    "google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
  ],
};

function findChromium(config) {
  if (config.chromium?.bin?.length > 0) return config.chromium.bin;
  const platform = process.platform;
  const candidates = CHROMIUM_CANDIDATES[platform] ?? CHROMIUM_CANDIDATES.linux;
  for (const c of candidates) {
    try {
      if (c.includes("/") || c.includes("\\")) {
        if (existsSync(c)) {
          console.log(`[boot] Found Chrome: ${c}`);
          return c;
        }
      } else {
        execSync(platform === "win32" ? `where "${c}"` : `which "${c}"`, {
          stdio: "ignore",
        });
        console.log(`[boot] Found Chrome in PATH: ${c}`);
        return c;
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

function buildChromiumArgs(config, port) {
  const url = FLAGS.isDev
    ? `http://localhost:${config.compositor?.devPort ?? 5173}`
    : `http://localhost:${port}`;
  const isWin = process.platform === "win32";
  const isMac = process.platform === "darwin";
  // --user-data-dir forces Chrome to launch a new isolated instance
  // instead of handing off to an existing Chrome process ("Opening in existing browser session")
  const userDataDir = join(ROOT, ".roni-chrome-profile");

  const args = [
    `--app=${url}`,
    `--user-data-dir=${userDataDir}`,
    "--profile-directory=RoniOS",
    "--start-maximized",
    "--disable-infobars",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-translate",
    "--disable-features=TranslateUI,MediaRouter",
    "--noerrdialogs",
    "--disable-session-crashed-bubble",
    "--disable-background-networking",
    "--disable-extensions",
    "--disable-component-extensions-with-background-pages",
    "--no-startup-window",
  ];

  // Remove --no-startup-window and use kiosk only on non-dev
  args.pop();
  if (!FLAGS.isDev) {
    args.push("--kiosk");
  }
  if (!isWin) args.push("--class=Roni", "--name=Roni");
  if (!FLAGS.isDev && !isWin && !isMac) {
    const p = config.display?.platform ?? "wayland";
    args.push(`--ozone-platform=${p}`);
    if (p === "drm")
      args.push("--use-gl=egl", "--enable-features=UseOzonePlatform");
  }
  if (isWin) args.push("--disable-gpu-sandbox", "--no-sandbox");
  return args;
}

function spawnChromium(config, port) {
  const bin = findChromium(config);
  if (!bin) {
    console.error(
      "[boot] Chrome/Chromium not found. Install: https://www.google.com/chrome/"
    );
    process.exit(1);
  }
  const args = buildChromiumArgs(config, port);
  console.log(`[boot] Launching: ${bin.split(/[/\\]/).pop()} ${args[0]}`);
  const isWin = process.platform === "win32";
  const child = spawn(bin, args, {
    stdio: isWin ? "ignore" : ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...(process.env.DISPLAY ? {} : { DISPLAY: ":0" }) },
    detached: false,
    windowsHide: isWin,
  });
  if (!isWin) {
    child.stdout.on("data", (d) => process.stdout.write(`[chromium] ${d}`));
    child.stderr.on("data", (d) => {
      const msg = d.toString();
      if (
        [
          "Failed to connect",
          "Missing X server",
          "MESA",
          "dri",
          "DevTools",
          "Gtk",
        ].some((s) => msg.includes(s))
      )
        return;
      process.stderr.write(`[chromium:err] ${msg}`);
    });
  }
  RUNTIME.chromium = child;
  const spawnTime = Date.now();

  child.on("exit", (code, signal) => {
    const uptime = Date.now() - spawnTime;
    console.warn(
      `[boot] Chromium exited (code=${code} signal=${signal} uptime=${uptime}ms)`
    );

    if (uptime < 3000) {
      // Exited too fast — likely "Opening in existing browser session" handoff
      // This means --user-data-dir wasn't respected or Chrome found a running instance
      console.error(
        "[boot] Chrome exited in under 3s. Is another Roni already running?"
      );
      console.error("[boot] Retrying in 3s with fresh profile...");
      setTimeout(() => {
        RUNTIME.chromium = spawnChromium(config, port);
      }, 3000);
    } else if (code !== 0 && code !== null) {
      console.log("[boot] Chrome crashed — restarting in 2s...");
      setTimeout(() => {
        RUNTIME.chromium = spawnChromium(config, port);
      }, 2000);
    } else {
      // Clean exit after normal use — user closed the window
      console.log("[boot] Chrome closed cleanly. Shutting down.");
      process.exit(0);
    }
  });
  child.on("error", (err) => {
    console.error(`[boot] Chrome launch failed: ${err.message}`);
    setTimeout(() => {
      RUNTIME.chromium = spawnChromium(config, port);
    }, 3000);
  });
  return child;
}

// ── Compositor HTTP server ────────────────────────────────────────────────────

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function startCompositorServer(config) {
  const port = config.compositor?.port ?? 7700;
  const compositorRoot = join(ROOT, "compositor", "dist");
  const hasDisk = !EMBEDDED_COMPOSITOR && existsSync(compositorRoot);

  if (!EMBEDDED_COMPOSITOR && !hasDisk) {
    console.error("[boot] No compositor found.");
    console.error(
      `[boot] Expected embedded files or compositor/dist/ at ${compositorRoot}`
    );
    process.exit(1);
  }

  console.log(
    `[boot] Compositor: ${
      EMBEDDED_COMPOSITOR
        ? "embedded (" + Object.keys(EMBEDDED_COMPOSITOR).length + " files)"
        : "disk"
    }`
  );

  const server = createServer((req, res) => {
    const urlPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
    const mime = MIME[extname(urlPath)] ?? "application/octet-stream";

    if (EMBEDDED_COMPOSITOR) {
      const data =
        EMBEDDED_COMPOSITOR[urlPath] ?? EMBEDDED_COMPOSITOR["/index.html"];
      res.setHeader(
        "Content-Type",
        EMBEDDED_COMPOSITOR[urlPath] ? mime : "text/html"
      );
      res.writeHead(200);
      res.end(data);
      return;
    }

    const filePath = join(compositorRoot, urlPath);
    const stream = createReadStream(filePath);
    stream.on("error", () => {
      res.setHeader("Content-Type", "text/html");
      res.writeHead(200);
      createReadStream(join(compositorRoot, "index.html")).pipe(res);
    });
    res.setHeader("Content-Type", mime);
    res.writeHead(200);
    stream.pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.listen(port, "127.0.0.1", () => {
      console.log(`[boot] Compositor server: http://localhost:${port}`);
      resolve(port);
    });
    server.on("error", reject);
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  process.title = "Roni";
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Roni OS — Booting");
  console.log(
    `  Node ${process.version} · ${FLAGS.isDev ? "DEV" : "PROD"} · SEA=${IS_SEA}`
  );
  console.log(`  argv[0]: ${process.argv[0]}`);
  console.log(`  execPath: ${process.execPath}`);
  console.log(`  ROOT: ${ROOT}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const config = loadConfig();
  const kernel = new KernelServices(config);
  await kernel.start();

  let port = config.compositor?.port ?? 7700;
  if (!FLAGS.isDev) {
    port = await startCompositorServer(config);
  } else {
    console.log("[boot] DEV mode — open http://localhost:5173");
  }

  RUNTIME.chromium = spawnChromium(config, port);
  await startSystemTrayIfAvailable(RUNTIME);

  // Keep the event loop alive — the HTTP server and Chrome process do this
  // naturally, but be explicit for SEA on Windows
  setInterval(() => {}, 1 << 30);
}

main().catch((err) => {
  console.error("[boot] Fatal:", err);
  process.exit(1);
});
