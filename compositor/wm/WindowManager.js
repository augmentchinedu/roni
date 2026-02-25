/**
 * roni/compositor/wm/WindowManager.js
 * 
 * Roni Window Manager
 * 
 * All "windows" in Roni are Vue-managed <iframe> sandboxes composited
 * by the Chromium renderer. The WM is a pure JS state machine backed
 * by a Pinia store.
 * 
 * Window lifecycle:
 *   launch → open → (focus | minimize | tile | maximize) → close
 * 
 * Window object:
 * {
 *   id: string,            // unique instance ID
 *   appId: string,         // 'com.roni.files'
 *   title: string,
 *   icon: string,          // URL
 *   src: string,           // iframe src URL
 *   token: string,         // capability token for SDK auth
 *   
 *   // Geometry
 *   x: number, y: number,
 *   width: number, height: number,
 *   
 *   // State
 *   focused: boolean,
 *   minimized: boolean,
 *   maximized: boolean,
 *   tiled: null | 'left' | 'right' | 'top' | 'bottom',
 *   zIndex: number,
 *   
 *   // Saved geometry (for restoring from maximize/tile)
 *   _saved: { x, y, width, height } | null,
 * }
 */

import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'
import { randomUUID } from '../bus/uuid.js'
import { bus } from '../bus/RoniBus.js'

const APP_REGISTRY_URL = 'http://apps.roni.local'
const BASE_Z = 10
const FOCUS_Z_BOOST = 1000

export const useWindowStore = defineStore('wm', () => {
  const windows = reactive(new Map())  // id → window
  let zCounter = BASE_Z

  // ─── Derived ─────────────────────────────────

  const windowList = computed(() => [...windows.values()])
  const focused = computed(() => windowList.value.find(w => w.focused) ?? null)
  const taskbarItems = computed(() =>
    windowList.value.map(w => ({
      id: w.id,
      appId: w.appId,
      title: w.title,
      icon: w.icon,
      minimized: w.minimized,
      focused: w.focused,
    }))
  )

  // ─── Lifecycle ───────────────────────────────

  async function launch(manifest, opts = {}) {
    const id = randomUUID()
    const token = await issueToken(id, manifest.permissions ?? [])

    // Default window geometry — center on screen
    const sw = window.screen.width
    const sh = window.screen.height
    const w = opts.width ?? manifest.windowDefaults?.width ?? 900
    const h = opts.height ?? manifest.windowDefaults?.height ?? 600
    const x = opts.x ?? Math.round((sw - w) / 2)
    const y = opts.y ?? Math.round((sh - h) / 2)

    const win = reactive({
      id,
      appId: manifest.id,
      title: manifest.name,
      icon: `${APP_REGISTRY_URL}/${manifest.id}/${manifest.icon ?? 'icon.svg'}`,
      src: `${APP_REGISTRY_URL}/${manifest.id}/${manifest.entry ?? 'app.html'}?token=${token}&wid=${id}`,
      token,

      x, y, width: w, height: h,
      focused: false,
      minimized: false,
      maximized: false,
      tiled: null,
      zIndex: BASE_Z,
      _saved: null,
    })

    windows.set(id, win)
    focus(id)

    console.log(`[wm] Launched ${manifest.id} → window ${id}`)
    return id
  }

  function close(id) {
    const win = windows.get(id)
    if (!win) return

    windows.delete(id)

    // If it was focused, focus the next highest window
    if (win.focused) {
      const next = windowList.value
        .filter(w => !w.minimized)
        .sort((a, b) => b.zIndex - a.zIndex)[0]
      if (next) focus(next.id)
    }

    console.log(`[wm] Closed window ${id}`)
  }

  // ─── Focus ───────────────────────────────────

  function focus(id) {
    for (const [wid, win] of windows) {
      win.focused = wid === id
    }
    const win = windows.get(id)
    if (win) {
      win.zIndex = ++zCounter + FOCUS_Z_BOOST
      win.minimized = false
    }
  }

  // ─── Minimize / Maximize / Tile ──────────────

  function minimize(id) {
    const win = windows.get(id)
    if (!win) return
    win.minimized = true
    win.focused = false

    // Focus next
    const next = windowList.value
      .filter(w => !w.minimized && w.id !== id)
      .sort((a, b) => b.zIndex - a.zIndex)[0]
    if (next) focus(next.id)
  }

  function maximize(id) {
    const win = windows.get(id)
    if (!win) return

    if (win.maximized) {
      // Restore
      if (win._saved) {
        Object.assign(win, win._saved)
        win._saved = null
      }
      win.maximized = false
    } else {
      win._saved = { x: win.x, y: win.y, width: win.width, height: win.height }
      win.x = 0
      win.y = 0    // Panel height = 32px but wm doesn't know about shell
      win.width = window.screen.width
      win.height = window.screen.height
      win.maximized = true
    }
    focus(id)
  }

  function tile(id, side) {
    const win = windows.get(id)
    if (!win) return

    const sw = window.screen.width
    const sh = window.screen.height
    const panelH = 32

    if (win.tiled === side) {
      // Untile
      if (win._saved) Object.assign(win, win._saved)
      win._saved = null
      win.tiled = null
      focus(id)
      return
    }

    win._saved = win._saved ?? { x: win.x, y: win.y, width: win.width, height: win.height }

    const tileMap = {
      left:   { x: 0,       y: panelH, width: sw / 2,     height: sh - panelH },
      right:  { x: sw / 2,  y: panelH, width: sw / 2,     height: sh - panelH },
      top:    { x: 0,       y: panelH, width: sw,          height: (sh - panelH) / 2 },
      bottom: { x: 0,       y: panelH + (sh - panelH) / 2, width: sw, height: (sh - panelH) / 2 },
      full:   { x: 0,       y: panelH, width: sw,          height: sh - panelH },
    }

    const geom = tileMap[side]
    if (!geom) return

    Object.assign(win, geom)
    win.tiled = side
    win.maximized = false
    focus(id)
  }

  // ─── Move / Resize ───────────────────────────

  function move(id, x, y) {
    const win = windows.get(id)
    if (!win || win.maximized || win.tiled) return
    win.x = x
    win.y = y
  }

  function resize(id, width, height) {
    const win = windows.get(id)
    if (!win || win.maximized || win.tiled) return
    win.width = Math.max(width, 300)
    win.height = Math.max(height, 200)
  }

  function setTitle(id, title) {
    const win = windows.get(id)
    if (win) win.title = title
  }

  // ─── App → WM bridge ─────────────────────────
  // Apps send postMessage to compositor; WindowFrame.vue validates
  // token and dispatches here.

  function handleAppMessage(id, msg) {
    switch (msg.method) {
      case 'window:setTitle': setTitle(id, msg.payload.title); break
      case 'window:minimize': minimize(id); break
      case 'window:maximize': maximize(id); break
      case 'window:close': close(id); break
      case 'window:resize': resize(id, msg.payload.width, msg.payload.height); break
      case 'window:focus': focus(id); break
    }
  }

  return {
    windows, windowList, focused, taskbarItems,
    launch, close, focus, minimize, maximize, tile,
    move, resize, setTitle, handleAppMessage,
  }
})

// ─── Token issuance ──────────────────────────

async function issueToken(windowId, permissions) {
  // In dev, return a mock token
  // In prod, this calls the kernel auth service
  if (import.meta.env?.DEV) {
    return btoa(JSON.stringify({ windowId, permissions, ts: Date.now() }))
  }
  return bus.request('auth', 'issueToken', { windowId, permissions })
}