/**
 * kernel/boot.js — Roni OS kernel entry point.
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

// ── ROOT resolution: works in normal Node AND as a SEA ──────────────────────
// In a SEA, import.meta.url is unavailable. We detect SEA by checking whether
// the argv[1] equals the execPath (i.e. the script IS the executable).
let __dirname_resolved;
try {
  __dirname_resolved = dirname(fileURLToPath(import.meta.url));
} catch {
  // SEA fallback: use directory of the executable itself
  __dirname_resolved = dirname(process.execPath);
}
const IS_SEA = process.argv[1] === process.execPath || !import.meta.url?.startsWith('file:');
const ROOT   = IS_SEA
  ? dirname(process.execPath)          // SEA: config/dist sit next to .exe
  : resolve(__dirname_resolved, ".."); // normal: one level up from kernel/
const IS_DEV = process.argv.includes("--dev");

// ── Config ───────────────────────────────────────────────────────────────────

async function loadConfig() {
  try {
    const raw = await readFile(resolve(ROOT, "config", "system.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    console.warn("[boot] No system.json found, using defaults");
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
    this.config  = config;
    this.bus     = new Bus(config);
    this.vfs     = new VFS(config);
    this.proc    = new ProcessManager(config, this.bus);
    this.display = new DisplayService(config, this.bus);
    this.power   = new PowerService(config, this.bus);
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
    this.bus.on("compositor:ready", async () => {
      console.log("[kernel] Compositor ready. Sending session info.");
      this.bus.send({
        to: "compositor", type: "event", domain: "kernel", method: "session:start",
        payload: {
          display: await this.display.getInfo(),
          session: await this.session.getCurrent(),
        },
      });
    });
    this.bus.on("power:shutdown", () => this.power.shutdown());
    this.bus.on("power:reboot",   () => this.power.reboot());
    this.bus.on("power:sleep",    () => this.power.sleep());
    process.on("uncaughtException", (err) => console.error("[kernel] Uncaught exception:", err));
  }
}

// ── Chromium detection + auto-download ───────────────────────────────────────

const CHROMIUM_CANDIDATES = {
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Chromium\\Application\\chrome.exe",
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.LOCALAPPDATA}\\Chromium\\Application\\chrome.exe`,
    `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
  ],
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ],
  linux: [
    "chromium-browser","chromium","google-chrome",
    "google-chrome-stable","/usr/bin/chromium-browser",
    "/usr/bin/chromium","/usr/bin/google-chrome",
  ],
};

async function findChromium(config) {
  if (config.chromium?.bin?.length > 0) {
    console.log(`[boot] Using configured Chromium: ${config.chromium.bin}`);
    return config.chromium.bin;
  }
  const { execSync } = await import("node:child_process");
  const { existsSync } = await import("node:fs");
  const platform = process.platform;
  const candidates = CHROMIUM_CANDIDATES[platform] ?? CHROMIUM_CANDIDATES.linux;

  for (const c of candidates) {
    try {
      if (c.includes("/") || c.includes("\\")) {
        if (existsSync(c)) { console.log(`[boot] Found Chromium: ${c}`); return c; }
      } else {
        execSync(platform === "win32" ? `where "${c}"` : `which "${c}"`, { stdio: "ignore" });
        console.log(`[boot] Found Chromium in PATH: ${c}`); return c;
      }
    } catch { /* try next */ }
  }
  return null;
}

async function downloadChromium() {
  console.log("[boot] Chromium not found. Auto-downloading via @puppeteer/browsers...");
  try {
    const { execSync } = await import("node:child_process");
    const cacheDir = resolve(ROOT, ".chromium");
    execSync("npm install --no-save @puppeteer/browsers", { cwd: ROOT, stdio: "inherit" });
    const { install, Browser } = await import("@puppeteer/browsers");
    const platform = process.platform === "win32" ? "win64"
      : process.platform === "darwin" ? "mac" : "linux";
    console.log(`[boot] Downloading Chrome for ${platform}...`);
    const result = await install({
      browser: Browser.CHROME,
      buildId: "stable",
      cacheDir,
      downloadProgressCallback: (dl, total) => {
        process.stdout.write(`\r[boot] Downloading Chrome... ${total ? Math.round((dl/total)*100) : "?"}%`);
      },
    });
    process.stdout.write("\n");
    console.log(`[boot] Chrome downloaded: ${result.executablePath}`);
    return result.executablePath;
  } catch (err) {
    console.error("[boot] Auto-download failed:", err.message);
    console.error("[boot] Install Chrome manually: https://www.google.com/chrome/");
    process.exit(1);
  }
}

function buildChromiumArgs(config, port) {
  const url  = IS_DEV ? `http://localhost:${config.compositor?.devPort ?? 5173}` : `http://localhost:${port}`;
  const isWin = process.platform === "win32";
  const isMac = process.platform === "darwin";

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
  ];

  if (!isWin) args.push("--class=Roni", "--name=Roni");

  if (!IS_DEV && !isWin && !isMac) {
    const p = config.display?.platform ?? "wayland";
    args.push(`--ozone-platform=${p}`);
    if (p === "drm") args.push("--use-gl=egl", "--enable-features=UseOzonePlatform");
  }

  if (isWin) args.push("--disable-gpu-sandbox", "--no-sandbox");

  return args;
}

async function spawnChromium(config, port) {
  let bin = await findChromium(config);
  if (!bin) bin = await downloadChromium();

  const args = buildChromiumArgs(config, port);
  console.log(`[boot] Launching: ${bin.split(/[/\\]/).pop()} ${args[0]}`);

  const child = spawn(bin, args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...(process.env.DISPLAY ? {} : { DISPLAY: ":0" }) },
    detached: false,
    // Windows: don't show a second console window
    windowsHide: false,
  });

  child.stdout.on("data", (d) => process.stdout.write(`[chromium] ${d}`));
  child.stderr.on("data", (d) => {
    const msg = d.toString();
    if (["Failed to connect to the bus","Missing X server","MESA","dri","DevTools"].some(s => msg.includes(s))) return;
    process.stderr.write(`[chromium:err] ${msg}`);
  });

  child.on("exit", (code, signal) => {
    console.warn(`[boot] Chromium exited (code=${code} signal=${signal})`);
    if (code !== 0 && code !== null) {
      console.log("[boot] Restarting Chromium in 2s...");
      setTimeout(() => spawnChromium(config, port), 2000);
    } else {
      console.log("[boot] Clean exit. Halting.");
      process.exit(0);
    }
  });

  // Keep Node alive — don't let it exit just because spawn returned
  child.on("error", (err) => {
    console.error(`[boot] Failed to launch Chromium: ${err.message}`);
    console.log("[boot] Retrying in 3s...");
    setTimeout(() => spawnChromium(config, port), 3000);
  });

  return child;
}

// ── Compositor HTTP server ────────────────────────────────────────────────────

async function startCompositorServer(config) {
  const { createReadStream, existsSync } = await import("node:fs");
  const { extname, join } = await import("node:path");
  const port = config.compositor?.port ?? 7700;
  const compositorRoot = resolve(ROOT, "compositor", "dist");

  if (!existsSync(compositorRoot)) {
    console.error(`[boot] compositor/dist not found at ${compositorRoot}`);
    console.error("[boot] Run 'npm run build' first.");
    process.exit(1);
  }

  const MIME = {
    ".html":"text/html", ".js":"application/javascript",
    ".css":"text/css",   ".svg":"image/svg+xml",
    ".json":"application/json", ".png":"image/png",
    ".ico":"image/x-icon", ".woff2":"font/woff2",
  };

  const server = createServer((req, res) => {
    const urlPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
    const filePath = join(compositorRoot, urlPath);
    const ext  = extname(filePath);
    const mime = MIME[ext] ?? "application/octet-stream";

    const stream = createReadStream(filePath);
    stream.on("error", () => {
      // SPA fallback — serve index.html for unknown routes
      const fallback = createReadStream(join(compositorRoot, "index.html"));
      res.setHeader("Content-Type", "text/html");
      res.writeHead(200);
      fallback.pipe(res);
    });
    res.setHeader("Content-Type", mime);
    res.writeHead(200);
    stream.pipe(res);
  });

  await new Promise((resolve, reject) => {
    server.listen(port, "127.0.0.1", resolve);
    server.on("error", reject);
  });

  console.log(`[boot] Compositor server: http://localhost:${port}`);
  return port;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  process.title = "Roni";
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Roni OS — Booting");
  console.log(`  Node ${process.version} · ${IS_SEA ? "SEA" : "ESM"} · ${IS_DEV ? "DEV" : "PROD"}`);
  console.log(`  ROOT: ${ROOT}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const config = await loadConfig();
  const kernel = new KernelServices(config);
  await kernel.start();

  let port = config.compositor?.port ?? 7700;
  if (!IS_DEV) {
    port = await startCompositorServer(config);
  } else {
    console.log("[boot] DEV mode — open http://localhost:5173 in your browser.");
  }

  await spawnChromium(config, port);

  // Explicitly keep Node alive (important for SEA on Windows)
  process.stdin.resume();
}

main().catch((err) => {
  console.error("[boot] Fatal error during boot:", err);
  process.exit(1);
});