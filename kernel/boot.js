/**
 * roni/kernel/boot.js
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

import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Bus } from './ipc/bus.js'
import { VFS } from './fs/vfs.js'
import { ProcessManager } from './proc/manager.js'
import { DisplayService } from './hw/display.js'
import { PowerService } from './power/manager.js'
import { SessionService } from './auth/session.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const IS_DEV = process.argv.includes('--dev')

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────

async function loadConfig() {
  try {
    const raw = await readFile(`${ROOT}/config/system.json`, 'utf8')
    return JSON.parse(raw)
  } catch {
    console.warn('[boot] No system.json found, using defaults')
    return {
      display: { platform: 'wayland', width: 1920, height: 1080 },
      compositor: { port: 7700 },
      chromium: {},  // no bin — triggers auto-detect
    }
  }
}

// ─────────────────────────────────────────────
// Kernel Services
// ─────────────────────────────────────────────

class KernelServices {
  constructor(config) {
    this.config = config
    this.bus = new Bus(config)
    this.vfs = new VFS(config)
    this.proc = new ProcessManager(config, this.bus)
    this.display = new DisplayService(config, this.bus)
    this.power = new PowerService(config, this.bus)
    this.session = new SessionService(config, this.bus)
  }

  async start() {
    console.log('[kernel] Starting Roni kernel services...')
    await this.bus.start()
    await this.vfs.start()
    await this.proc.start()
    await this.display.start()
    await this.power.start()
    await this.session.start()
    this.registerHandlers()
    console.log('[kernel] All services started.')
  }

  registerHandlers() {
    // Kernel responds to compositor:ready from display layer
    this.bus.on('compositor:ready', async (msg) => {
      console.log('[kernel] Compositor ready. Sending session info.')
      this.bus.send({
        to: 'compositor',
        type: 'event',
        domain: 'kernel',
        method: 'session:start',
        payload: {
          display: await this.display.getInfo(),
          session: await this.session.getCurrent(),
        }
      })
    })

    // Power events from compositor
    this.bus.on('power:shutdown', () => this.power.shutdown())
    this.bus.on('power:reboot', () => this.power.reboot())
    this.bus.on('power:sleep', () => this.power.sleep())

    // Handle uncaught errors gracefully
    process.on('uncaughtException', (err) => {
      console.error('[kernel] Uncaught exception:', err)
    })
  }
}

// ─────────────────────────────────────────────
// Chromium Launcher
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Chromium binary detection + auto-download
// ─────────────────────────────────────────────

const CHROMIUM_CANDIDATES = {
  win32:  [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Chromium\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.LOCALAPPDATA}\\Chromium\\Application\\chrome.exe`,
  ],
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ],
  linux:  [
    'chromium-browser', 'chromium', 'google-chrome',
    'google-chrome-stable', 'google-chrome-beta',
    '/usr/bin/chromium-browser', '/usr/bin/chromium',
    '/usr/bin/google-chrome',
  ],
}

async function findChromium(config) {
  // 1. Explicit non-empty config override only
  if (config.chromium?.bin && config.chromium.bin.length > 0) {
    console.log(`[boot] Using configured Chromium: ${config.chromium.bin}`)
    return config.chromium.bin
  }

  const { execSync } = await import('node:child_process')
  const { existsSync } = await import('node:fs')
  const platform = process.platform

  const candidates = CHROMIUM_CANDIDATES[platform] ?? CHROMIUM_CANDIDATES.linux

  for (const candidate of candidates) {
    try {
      // For absolute paths — check existence directly
      if (candidate.includes('/') || candidate.includes('\\')) {
        if (existsSync(candidate)) {
          console.log(`[boot] Found Chromium: ${candidate}`)
          return candidate
        }
      } else {
        // For bare names — check if they're in PATH
        const cmd = platform === 'win32' ? `where ${candidate}` : `which ${candidate}`
        execSync(cmd, { stdio: 'ignore' })
        console.log(`[boot] Found Chromium in PATH: ${candidate}`)
        return candidate
      }
    } catch { /* not found, try next */ }
  }

  return null
}

async function downloadChromium() {
  console.log('[boot] Chromium not found. Auto-downloading via @puppeteer/browsers...')
  try {
    // Use npx to avoid needing it as a dep
    const { execSync } = await import('node:child_process')
    const { existsSync } = await import('node:fs')
    const cacheDir = resolve(ROOT, '.chromium')

    // Install @puppeteer/browsers if not already present
    execSync(
      'npm install --no-save @puppeteer/browsers',
      { cwd: ROOT, stdio: 'inherit' }
    )

    const { install, Browser } = await import('@puppeteer/browsers')

    const platform = process.platform === 'win32' ? 'win64'
      : process.platform === 'darwin' ? 'mac'
      : 'linux'

    console.log(`[boot] Downloading Chrome for ${platform}...`)
    const result = await install({
      browser: Browser.CHROME,
      buildId: 'stable',
      cacheDir,
      downloadProgressCallback: (dl, total) => {
        const pct = total ? Math.round((dl / total) * 100) : '?'
        process.stdout.write(`\r[boot] Downloading Chrome... ${pct}%`)
      }
    })
    process.stdout.write('\n')
    console.log(`[boot] Chrome downloaded: ${result.executablePath}`)
    return result.executablePath
  } catch (err) {
    console.error('[boot] Auto-download failed:', err.message)
    console.error('[boot] Please install Chrome manually: https://www.google.com/chrome/')
    process.exit(1)
  }
}

function buildChromiumArgs(config, port, bin) {
  const url = IS_DEV
    ? `http://localhost:${config.compositor?.devPort ?? 5173}`
    : `http://localhost:${port}`

  const isWindows = process.platform === 'win32'
  const isMac     = process.platform === 'darwin'

  const args = [
    `--app=${url}`,
    '--start-fullscreen',
    '--disable-infobars',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-translate',
    '--disable-features=TranslateUI',
    '--noerrdialogs',
    '--kiosk',
  ]

  // Identity flags — Linux/Mac only (WM_CLASS not applicable on Windows)
  if (!isWindows) {
    args.push('--class=Roni', '--name=Roni')
  }

  if (!IS_DEV && !isWindows && !isMac) {
    const platform = config.display?.platform ?? 'wayland'
    args.push(`--ozone-platform=${platform}`)
    if (platform === 'drm') {
      args.push('--use-gl=egl', '--enable-features=UseOzonePlatform')
    }
  }

  // Windows: disable GPU sandbox issues common in kiosk mode
  if (isWindows) {
    args.push('--disable-gpu-sandbox', '--no-sandbox')
  }

  return args
}

async function spawnChromium(config, port) {
  let bin = await findChromium(config)

  if (!bin) {
    bin = await downloadChromium()
  }

  const args = buildChromiumArgs(config, port, bin)
  console.log(`[boot] Launching Chromium: ${bin.split(/[/\\]/).pop()} ${args[0]} ...`)

  const child = spawn(bin, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      ...(process.env.DISPLAY ? {} : { DISPLAY: ':0' }),
    },
    detached: false,
  })

  child.stdout.on('data', (d) => process.stdout.write(`[chromium] ${d}`))
  child.stderr.on('data', (d) => {
    const msg = d.toString()
    // Suppress noisy but harmless Chromium warnings
    if (msg.includes('Failed to connect to the bus') ||
        msg.includes('Missing X server') ||
        msg.includes('MESA') ||
        msg.includes('dri')) return
    process.stderr.write(`[chromium:err] ${msg}`)
  })

  child.on('exit', (code, signal) => {
    console.warn(`[boot] Chromium exited (code=${code} signal=${signal})`)
    if (code !== 0 && code !== null) {
      console.log('[boot] Restarting Chromium in 2s...')
      setTimeout(() => spawnChromium(config, port), 2000)
    } else {
      console.log('[boot] Clean Chromium exit. Halting.')
      process.exit(0)
    }
  })

  return child
}

// ─────────────────────────────────────────────
// Compositor HTTP Server (serves compositor/ dir)
// ─────────────────────────────────────────────

async function startCompositorServer(config) {
  const { createReadStream } = await import('node:fs')
  const { extname } = await import('node:path')
  const port = config.compositor?.port ?? 7700
  const compositorRoot = resolve(ROOT, 'compositor', 'dist')

  const MIME = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.vue': 'application/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
  }

  const server = createServer(async (req, res) => {
    let filePath = resolve(compositorRoot, '.' + (req.url === '/' ? '/index.html' : req.url))
    const ext = extname(filePath)
    const mime = MIME[ext] ?? 'application/octet-stream'

    try {
      res.setHeader('Content-Type', mime)
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
      createReadStream(filePath).pipe(res)
    } catch {
      res.writeHead(404)
      res.end('Not found')
    }
  })

  await new Promise((resolve, reject) => {
    server.listen(port, '127.0.0.1', resolve)
    server.on('error', reject)
  })

  console.log(`[boot] Compositor server: http://localhost:${port}`)
  return port
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function main() {
  // Rename the Node process — shows as 'Roni' in ps, top, and taskbars
  process.title = 'Roni'

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Roni OS — Booting')
  console.log(`  Node ${process.version} · ESM · ${IS_DEV ? 'DEV' : 'PROD'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const config = await loadConfig()

  // Start kernel services (IPC bus first)
  const kernel = new KernelServices(config)
  await kernel.start()

  // Serve compositor (in prod; dev uses Vite)
  let port = config.compositor?.port ?? 7700
  if (!IS_DEV) {
    port = await startCompositorServer(config)
  }

  // Launch Chromium
  await spawnChromium(config, port)
}

main().catch((err) => {
  console.error('[boot] Fatal error during boot:', err)
  process.exit(1)
})git add kernel/boot.js
git commit -m "fix: auto-detect Chrome on Windows — remove hardcoded bin default"
git push origin main
```

Pull on your local machine and run again. You should now see:
```
[boot] Found Chromium: C:\Program Files\Google\Chrome\Application\chrome.exe
[boot] Launching Chromium: chrome.exe --app=http://localhost:7700 ...