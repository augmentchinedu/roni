# Roni OS — Architecture Specification

> Version 0.1 · 100% JavaScript ESM · Node + Chromium + Vue

---

## Overview

Roni is a desktop operating system whose entire userspace is JavaScript. It boots
to a Node.js process that spawns a custom Chromium build as its sole display
surface. Vue 3 runs inside Chromium and acts as the compositor, window manager,
and application shell simultaneously. There is no Electron, no Tauri, no native
UI toolkit.

```
┌─────────────────────────────────────────────────────┐
│                   HARDWARE / KERNEL                  │
├─────────────────────────────────────────────────────┤
│            Linux (minimal, init → roni-boot)         │
├─────────────────────────────────────────────────────┤
│  Node.js (Kernel Layer)                              │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐            │
│  │  kernel/ │ │  fs/     │ │  ipc/     │            │
│  │  boot.js │ │  vfs.js  │ │  bus.js   │            │
│  └──────────┘ └──────────┘ └───────────┘            │
│                     │  Unix Socket / stdin-stdout    │
├────────────────────────────────────────────────────  │
│  Chromium (Display Layer)                            │
│  ┌─────────────────────────────────────────────────┐ │
│  │  compositor/  (Vue 3 App)                        │ │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │ │
│  │  │  Shell   │ │  WM      │ │  App Launcher    │  │ │
│  │  │  (dock,  │ │  (window │ │  (iframe sandbox)│  │ │
│  │  │   panel) │ │   tiles) │ │                  │  │ │
│  │  └──────────┘ └──────────┘ └─────────────────┘  │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Layer Definitions

### 1. Boot Layer (`kernel/boot.js`)

- Entry point. Node.js ESM script invoked by init.
- Mounts the virtual filesystem (VFS).
- Starts the IPC message bus (Unix domain socket).
- Spawns Chromium with `--app=file:///roni/compositor/index.html`
  and `--enable-blink-features=RawClipboard` etc.
- Owns the session: if Chromium exits, Roni restarts or halts.

### 2. Kernel Layer (`kernel/`)

Services running in Node, exposed to Chromium via IPC bus:

| Module             | Responsibility                                      |
| ------------------ | --------------------------------------------------- |
| `fs/vfs.js`        | Virtual filesystem abstraction over real FS         |
| `proc/manager.js`  | Spawn, kill, signal child processes                 |
| `net/proxy.js`     | Network requests on behalf of sandboxed apps        |
| `hw/input.js`      | Raw input events (keyboard, pointer) via evdev      |
| `hw/display.js`    | Screen geometry, DPI, display enumeration           |
| `power/manager.js` | Sleep, hibernate, shutdown                          |
| `ipc/bus.js`       | Central message router (kernel ↔ compositor ↔ apps) |
| `auth/session.js`  | Users, permissions, capability tokens               |

### 3. IPC Bus (`kernel/ipc/bus.js`)

The single communication channel between Node and Chromium.

**Transport**: Unix domain socket at `/run/roni/bus.sock`

**Protocol**: Newline-delimited JSON (NDJSON) over the socket.
Chromium side connects via `WebSocket` pointed at a lightweight
ws server Node runs on `ws+unix:///run/roni/bus.sock`.

```
// Message envelope
{
  "id": "uuid-v4",          // correlation ID
  "from": "kernel|app-id",  // sender
  "to": "kernel|app-id|*",  // target or broadcast
  "type": "request|event|response|error",
  "domain": "fs|proc|hw|net|power|auth",
  "method": "readFile|spawn|...",
  "payload": { ...args },
  "token": "capability-token"  // for sandboxed app calls
}
```

**Pattern**: Request/Response with event subscriptions.
Apps never talk to the socket directly — they talk to the
`sdk/roni.js` client which handles auth, correlation, and retries.

### 4. Compositor Layer (`compositor/`)

A Vue 3 application that IS the desktop. Runs in Chromium fullscreen.

```
compositor/
  index.html          ← Chromium entry point
  main.js             ← Vue app bootstrap (ESM)
  App.vue             ← Root: orchestrates all layers

  layers/
    WallpaperLayer.vue    ← z-index 0, GPU-composited
    WindowLayer.vue       ← z-index 10, manages WindowFrame[]
    ShellLayer.vue        ← z-index 100, dock + panel
    OverlayLayer.vue      ← z-index 200, spotlight, notifications
    LockLayer.vue         ← z-index 999, lock screen

  wm/
    WindowManager.js      ← window state machine (open/focus/minimize/tile)
    WindowFrame.vue        ← chrome: titlebar, resize handles, shadow
    WorkspaceManager.js   ← virtual desktop management

  shell/
    Dock.vue
    Panel.vue             ← top bar: clock, sys tray, wifi, battery
    AppLauncher.vue        ← spotlight-style search + launch
    Notifications.vue

  bus/
    RoniBus.js            ← WebSocket client to kernel IPC bus
    useKernel.js          ← Vue composable wrapping RoniBus
```

### 5. App Model

Each Roni app runs inside a sandboxed `<iframe>` within WindowFrame.
Apps are directories with a `manifest.json` and an ESM entry point.

```json
// manifest.json
{
  "id": "com.roni.files",
  "name": "Files",
  "version": "1.0.0",
  "entry": "app.html",
  "icon": "icon.svg",
  "permissions": ["fs.read", "fs.write", "proc.spawn"],
  "windowDefaults": {
    "width": 900,
    "height": 600,
    "resizable": true
  }
}
```

Apps receive a `RoniSDK` instance injected via `postMessage` handshake.
The SDK proxies all kernel calls through the compositor's bus with the
app's capability token, so apps can never exceed their declared permissions.

```
App iframe
   │  postMessage({ type: 'roni:ready' })
   │
Compositor (WindowFrame.vue)
   │  validates, issues capability token
   │  postMessage({ type: 'roni:sdk', token, api })
   │
App iframe
   │  const roni = await getRoniSDK()
   │  const content = await roni.fs.readFile('/home/user/doc.txt')
```

### 6. SDK (`sdk/roni.js`)

The only import an app needs. Isomorphic ESM module.

```js
import { getRoniSDK } from "/roni/sdk/roni.js";
const roni = await getRoniSDK();

// File system
await roni.fs.readFile(path, opts);
await roni.fs.writeFile(path, data);
await roni.fs.readdir(path);

// Processes
const proc = await roni.proc.spawn(cmd, args, opts);
proc.stdout.on("data", handler);

// Windowing
await roni.window.setTitle("My App");
await roni.window.resize(1200, 800);
await roni.window.minimize();

// Events
roni.on("window:focus", handler);
roni.on("window:blur", handler);

// Notifications
await roni.notify({ title: "Done", body: "File saved." });
```

---

## File System Layout (on disk)

```
/roni/                      ← Roni OS root
  kernel/                   ← Node.js processes
    boot.js                 ← PID 1 equivalent
    ipc/bus.js
    fs/vfs.js
    proc/manager.js
    hw/input.js
    hw/display.js
    power/manager.js
    auth/session.js
  compositor/               ← Chromium app root
    index.html
    main.js
    App.vue
    layers/ wm/ shell/ bus/
  apps/                     ← Built-in apps
    files/
    terminal/
    settings/
    browser/
  sdk/
    roni.js                 ← App SDK
  config/
    system.json             ← Hardware config
    users.json
  data/                     ← User data
    home/
  node_modules/             ← Node deps (ws, etc.)
  package.json
```

---

## Boot Sequence

```
1. Linux kernel boots → init calls: node /roni/kernel/boot.js
2. boot.js:
   a. Reads /roni/config/system.json
   b. Mounts VFS
   c. Starts IPC bus WebSocket server on /run/roni/bus.sock
   d. Starts input/hw services
   e. Spawns Chromium:
        chromium-browser \
          --app=file:///roni/compositor/index.html \
          --start-fullscreen \
          --no-sandbox \          ← running as our own user
          --disable-infobars \
          --kiosk \
          --enable-features=UseOzonePlatform \
          --ozone-platform=wayland (or drm for framebuffer)
3. Chromium loads compositor/index.html
4. Vue app mounts → RoniBus.js connects WebSocket to bus.sock
5. Compositor emits 'compositor:ready' to kernel
6. Kernel responds with display info, user session
7. Vue renders desktop
8. User sees Roni
```

---

## Technology Decisions

| Concern               | Decision                             | Rationale                                  |
| --------------------- | ------------------------------------ | ------------------------------------------ |
| Node ↔ Chromium IPC   | WebSocket over Unix socket           | No native bindings; pure JS both sides     |
| Chromium embedding    | `--app` mode (kiosk)                 | No Electron overhead; we own Chromium      |
| Vue reactivity for WM | Pinia store                          | Window state is global, reactive           |
| App sandboxing        | `<iframe sandbox>` + postMessage     | Browser-native, no extra runtime           |
| ESM everywhere        | Node 22+ `"type":"module"`           | No CJS; clean import graph                 |
| Styling               | CSS custom properties + Tailwind CDN | No build step in compositor                |
| Display server        | Chromium's Ozone/DRM                 | Chromium IS the display server             |
| Input events          | Node `evdev` → IPC → Compositor      | Raw events, no X11/Wayland needed          |
| Package manager       | npm workspaces                       | Monorepo: kernel + compositor + sdk + apps |

---

## Critical Constraints

1. **No bundler in production.** Compositor loads raw `.vue` files via
   `vue3-sfc-loader` or pre-compiled to plain `.js` ESM. Dev uses Vite.
2. **Chromium must trust `file://` origin** or we serve compositor
   from `http://localhost` via a tiny Node http server — recommended
   to avoid `file://` cross-origin iframe restrictions for apps.

3. **App iframes** should be served from a separate origin:
   `http://apps.roni.local` (resolved via `/etc/hosts`) so the compositor
   origin (`http://roni.local`) can `postMessage` to them safely.

4. **No `require()`**. All Node code uses `import`. The `ws` package and
   all deps must be ESM-compatible (ws@8+ supports ESM).

5. **Chromium flags** for a bare-metal display: `--ozone-platform=drm`
   skips Wayland/X11 entirely and renders to the framebuffer.

---

## Development Setup

```bash
# Install deps
npm install

# Dev mode: Vite serves compositor, Node runs kernel with mock IPC
npm run dev

# Build: compile Vue SFCs to ESM, output to /roni/
npm run build

# In production, no npm, no Vite — just:
node /roni/kernel/boot.js
```

---

## Roadmap (Phases)

**Phase 1 — Shell (now)**

- [ ] Boot sequence (boot.js → Chromium)
- [ ] IPC bus (kernel ↔ compositor)
- [ ] Compositor with WM (open/close/move/resize windows)
- [ ] Shell (panel, dock, app launcher)
- [ ] SDK (fs, window, notify)

**Phase 2 — Apps**

- [ ] Files app
- [ ] Terminal app (pty via Node)
- [ ] Settings app
- [ ] Text editor

**Phase 3 — Platform**

- [ ] Multi-user auth
- [ ] App store / package manager
- [ ] Wayland fallback
- [ ] Hardware drivers (wifi, bluetooth)

**Phase 4 — Self-hosting**

- [ ] Roni built on Roni
- [ ] Browser app
- [ ] VS Code-like IDE app
