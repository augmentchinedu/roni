<template>
  <div class="dock-wrap">
    <div class="dock">
      <!-- Pinned apps -->
      <div
        v-for="app in PINNED_APPS"
        :key="app.id"
        class="dock-item"
        :class="{ active: isRunning(app.id), focused: isFocused(app.id) }"
        :title="app.name"
        @click="launchOrFocus(app)"
      >
        <div class="dock-icon">
          <component :is="app.icon" />
        </div>
        <div v-if="isRunning(app.id)" class="dock-dot" />
      </div>

      <div class="dock-sep" />

      <!-- Running apps not in pinned list -->
      <template v-for="win in unpinnedRunning" :key="win.id">
        <div
          class="dock-item"
          :class="{ focused: win.focused, minimized: win.minimized }"
          :title="win.title"
          @click="focusOrRestore(win)"
        >
          <div class="dock-icon dock-icon--generic">
            <span>{{ win.title[0] }}</span>
          </div>
          <div class="dock-dot" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, h } from 'vue'
import { useWindowStore } from '../wm/WindowManager.js'

const wm = useWindowStore()

// ── Built-in app manifests ────────────────────
const PINNED_APPS = [
  {
    id: 'com.roni.files',
    name: 'Files',
    icon: () => h('svg', { width: 22, height: 22, viewBox: '0 0 22 22', fill: 'none' }, [
      h('rect', { x: 2, y: 4, width: 18, height: 15, rx: 2.5, fill: 'var(--accent)', opacity: 0.15, stroke: 'var(--accent)', 'stroke-width': 1.2 }),
      h('path', { d: 'M2 8h18', stroke: 'var(--accent)', 'stroke-width': 1.2 }),
      h('path', { d: 'M2 7a2.5 2.5 0 012.5-2.5h3l2 2H2z', fill: 'var(--accent)', opacity: 0.6 }),
    ]),
    manifest: { id: 'com.roni.files', name: 'Files', entry: 'app.html', permissions: ['fs.read', 'fs.write'], windowDefaults: { width: 860, height: 560 } }
  },
  {
    id: 'com.roni.terminal',
    name: 'Terminal',
    icon: () => h('svg', { width: 22, height: 22, viewBox: '0 0 22 22', fill: 'none' }, [
      h('rect', { x: 2, y: 3, width: 18, height: 16, rx: 2.5, fill: 'var(--bg-base)', stroke: 'var(--border-active)', 'stroke-width': 1.2 }),
      h('path', { d: 'M6 8l4 3-4 3', stroke: 'var(--ok)', 'stroke-width': 1.4, 'stroke-linecap': 'round' }),
      h('path', { d: 'M12 14h4', stroke: 'var(--text-secondary)', 'stroke-width': 1.4, 'stroke-linecap': 'round' }),
    ]),
    manifest: { id: 'com.roni.terminal', name: 'Terminal', entry: 'app.html', permissions: ['proc.spawn', 'fs.read', 'fs.write'], windowDefaults: { width: 720, height: 460 } }
  },
  {
    id: 'com.roni.settings',
    name: 'Settings',
    icon: () => h('svg', { width: 22, height: 22, viewBox: '0 0 22 22', fill: 'none' }, [
      h('circle', { cx: 11, cy: 11, r: 3, stroke: 'var(--text-secondary)', 'stroke-width': 1.3 }),
      h('path', { d: 'M11 2v2M11 18v2M2 11h2M18 11h2M4.93 4.93l1.41 1.41M15.66 15.66l1.41 1.41M4.93 17.07l1.41-1.41M15.66 6.34l1.41-1.41', stroke: 'var(--text-secondary)', 'stroke-width': 1.3, 'stroke-linecap': 'round' }),
    ]),
    manifest: { id: 'com.roni.settings', name: 'Settings', entry: 'app.html', permissions: [], windowDefaults: { width: 720, height: 500 } }
  },
]

const pinnedIds = new Set(PINNED_APPS.map(a => a.id))

const isRunning = (appId) => wm.windowList.some(w => w.appId === appId)
const isFocused = (appId) => wm.windowList.some(w => w.appId === appId && w.focused)

const unpinnedRunning = computed(() =>
  wm.windowList.filter(w => !pinnedIds.has(w.appId))
)

function launchOrFocus(app) {
  const existing = wm.windowList.find(w => w.appId === app.id)
  if (existing) {
    if (existing.minimized || !existing.focused) wm.focus(existing.id)
    else wm.minimize(existing.id)
  } else {
    wm.launch(app.manifest)
  }
}

function focusOrRestore(win) {
  if (win.minimized || !win.focused) wm.focus(win.id)
  else wm.minimize(win.id)
}
</script>

<style scoped>
.dock-wrap {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.dock {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(14,18,25,0.88);
  backdrop-filter: blur(32px) saturate(200%);
  -webkit-backdrop-filter: blur(32px) saturate(200%);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset;
}

.dock-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 48px; height: 48px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1), background 0.12s;
}
.dock-item:hover { transform: scale(1.18) translateY(-4px); background: var(--bg-overlay); }
.dock-item.focused { background: var(--accent-dim); }
.dock-item.minimized { opacity: 0.5; }

.dock-icon {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 9px;
}

.dock-icon--generic {
  background: var(--bg-overlay);
  border: 1px solid var(--border);
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.dock-dot {
  position: absolute;
  bottom: 3px;
  width: 4px; height: 4px;
  border-radius: 50%;
  background: var(--accent);
}

.dock-sep {
  width: 1px;
  height: 32px;
  background: var(--border);
  margin: 0 4px;
}
</style>