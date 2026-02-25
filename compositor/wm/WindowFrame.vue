<template>
  <div
    class="window-frame"
    :class="{
      focused: win.focused,
      minimized: win.minimized,
      maximized: win.maximized,
      tiled: !!win.tiled,
    }"
    :style="frameStyle"
    @mousedown="onFrameClick"
  >
    <!-- Titlebar -->
    <div class="titlebar" @mousedown.stop="startDrag">
      <!-- Traffic lights -->
      <div class="traffic-lights">
        <button class="tl tl-close" @click.stop="wm.close(win.id)" title="Close" />
        <button class="tl tl-min"   @click.stop="wm.minimize(win.id)" title="Minimize" />
        <button class="tl tl-max"   @click.stop="wm.maximize(win.id)" title="Maximize" />
      </div>
      <span class="titlebar-title">{{ win.title }}</span>
      <div class="titlebar-spacer" />
    </div>

    <!-- Content -->
    <div class="window-content">
      <iframe
        v-if="!win.minimized"
        :src="win.src"
        class="window-iframe"
        sandbox="allow-scripts allow-same-origin allow-forms"
        @load="onIframeLoad"
        :ref="el => iframeEl = el"
      />
    </div>

    <!-- Resize handles -->
    <template v-if="!win.maximized && !win.tiled">
      <div class="resize-handle resize-n"  @mousedown.stop="startResize('n')" />
      <div class="resize-handle resize-s"  @mousedown.stop="startResize('s')" />
      <div class="resize-handle resize-e"  @mousedown.stop="startResize('e')" />
      <div class="resize-handle resize-w"  @mousedown.stop="startResize('w')" />
      <div class="resize-handle resize-ne" @mousedown.stop="startResize('ne')" />
      <div class="resize-handle resize-nw" @mousedown.stop="startResize('nw')" />
      <div class="resize-handle resize-se" @mousedown.stop="startResize('se')" />
      <div class="resize-handle resize-sw" @mousedown.stop="startResize('sw')" />
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useWindowStore } from '../wm/WindowManager.js'

const props = defineProps({ win: { type: Object, required: true } })
const wm = useWindowStore()
const iframeEl = ref(null)

const TITLEBAR_H = 36

const frameStyle = computed(() => ({
  left:    props.win.x + 'px',
  top:     props.win.y + 'px',
  width:   props.win.width + 'px',
  height:  props.win.height + 'px',
  zIndex:  props.win.zIndex,
  display: props.win.minimized ? 'none' : 'flex',
}))

function onFrameClick() {
  if (!props.win.focused) wm.focus(props.win.id)
}

// ── Drag ─────────────────────────────────────
let dragStart = null

function startDrag(e) {
  if (props.win.maximized || props.win.tiled) return
  wm.focus(props.win.id)
  dragStart = { mx: e.clientX, my: e.clientY, wx: props.win.x, wy: props.win.y }

  const move = (e) => {
    const dx = e.clientX - dragStart.mx
    const dy = e.clientY - dragStart.my
    wm.move(props.win.id, dragStart.wx + dx, dragStart.wy + dy)
  }
  const up = () => {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
}

// ── Resize ───────────────────────────────────
function startResize(dir) {
  const start = {
    mx: event.clientX, my: event.clientY,
    x: props.win.x, y: props.win.y,
    w: props.win.width, h: props.win.height,
  }

  const move = (e) => {
    const dx = e.clientX - start.mx
    const dy = e.clientY - start.my
    let { x, y, w, h } = start

    if (dir.includes('e')) w = Math.max(300, w + dx)
    if (dir.includes('s')) h = Math.max(200, h + dy)
    if (dir.includes('w')) { w = Math.max(300, w - dx); x = start.x + (start.w - w) }
    if (dir.includes('n')) { h = Math.max(200, h - dy); y = start.y + (start.h - h) }

    wm.move(props.win.id, x, y)
    wm.resize(props.win.id, w, h)
  }
  const up = () => {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
}

// ── App postMessage bridge ────────────────────
function onIframeLoad() {
  const iframe = iframeEl.value
  if (!iframe) return
  window.addEventListener('message', (ev) => {
    if (ev.source !== iframe.contentWindow) return
    const msg = ev.data
    if (!msg?.__roni) return
    if (msg.type === 'handshake') {
      iframe.contentWindow.postMessage({ __roni: true, type: 'handshake:ack' }, '*')
    } else {
      wm.handleAppMessage(props.win.id, msg)
    }
  })
}
</script>

<style scoped>
.window-frame {
  position: absolute;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-window);
  border: 1px solid var(--border);
  transition: box-shadow 0.2s, border-color 0.2s, opacity 0.15s;
  will-change: transform;
  background: var(--bg-surface);
}

.window-frame.focused {
  border-color: var(--border-active);
  box-shadow: 0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.1);
}

.window-frame.maximized,
.window-frame.tiled {
  border-radius: 0;
  border: none;
}

/* Titlebar */
.titlebar {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 12px;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  cursor: default;
  gap: 10px;
}

.traffic-lights {
  display: flex;
  gap: 6px;
  align-items: center;
}

.tl {
  width: 12px; height: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: filter 0.12s;
}
.tl:hover { filter: brightness(1.3); }
.tl-close  { background: var(--danger); }
.tl-min    { background: var(--warn); }
.tl-max    { background: var(--ok); }

.window-frame:not(.focused) .tl { background: var(--bg-overlay); }

.titlebar-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  letter-spacing: 0.01em;
  flex: 1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.window-frame.focused .titlebar-title { color: var(--text-primary); }
.titlebar-spacer { width: 52px; }

/* Content */
.window-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--bg-base);
}

.window-iframe {
  width: 100%; height: 100%;
  border: none;
  display: block;
}

/* Resize handles */
.resize-handle {
  position: absolute;
  z-index: 10;
}
.resize-n  { top: -4px;    left: 8px;    right: 8px;   height: 8px;  cursor: n-resize; }
.resize-s  { bottom: -4px; left: 8px;    right: 8px;   height: 8px;  cursor: s-resize; }
.resize-e  { right: -4px;  top: 8px;     bottom: 8px;  width: 8px;   cursor: e-resize; }
.resize-w  { left: -4px;   top: 8px;     bottom: 8px;  width: 8px;   cursor: w-resize; }
.resize-ne { top: -4px;    right: -4px;  width: 14px;  height: 14px; cursor: ne-resize; }
.resize-nw { top: -4px;    left: -4px;   width: 14px;  height: 14px; cursor: nw-resize; }
.resize-se { bottom: -4px; right: -4px;  width: 14px;  height: 14px; cursor: se-resize; }
.resize-sw { bottom: -4px; left: -4px;   width: 14px;  height: 14px; cursor: sw-resize; }
</style>
