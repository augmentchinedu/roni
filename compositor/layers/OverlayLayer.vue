<template>
  <div class="overlay-layer">
    <!-- App Launcher -->
    <Transition name="launcher">
      <div v-if="showLauncher" class="launcher-backdrop" @click.self="showLauncher = false">
        <div class="launcher">
          <div class="launcher-search">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="var(--text-tertiary)" stroke-width="1.4"/>
              <path d="M10 10l3.5 3.5" stroke="var(--text-tertiary)" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
            <input
              v-model="query"
              ref="searchInput"
              placeholder="Search apps…"
              @keydown.escape="showLauncher = false"
              @keydown.enter="launchFirst"
            />
          </div>
          <div class="launcher-results">
            <div
              v-for="app in filteredApps"
              :key="app.id"
              class="launcher-item"
              @click="launch(app)"
            >
              <div class="launcher-item-icon">{{ app.name[0] }}</div>
              <div class="launcher-item-info">
                <span class="launcher-item-name">{{ app.name }}</span>
                <span class="launcher-item-id">{{ app.id }}</span>
              </div>
            </div>
            <div v-if="filteredApps.length === 0" class="launcher-empty">
              No apps found
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Notifications -->
    <div class="notifications">
      <TransitionGroup name="notif">
        <div v-for="n in notifications" :key="n.id" class="notification" @click="dismiss(n.id)">
          <div class="notif-body">
            <span class="notif-title">{{ n.title }}</span>
            <span class="notif-text">{{ n.body }}</span>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useWindowStore } from '../wm/WindowManager.js'

const wm = useWindowStore()
const showLauncher = ref(false)
const query = ref('')
const searchInput = ref(null)
const notifications = ref([])

// ── App registry (will come from kernel in prod) ──
const ALL_APPS = [
  { id: 'com.roni.files',    name: 'Files',    manifest: { id: 'com.roni.files',    name: 'Files',    entry: 'app.html', permissions: ['fs.read','fs.write'], windowDefaults: { width: 860, height: 560 } } },
  { id: 'com.roni.terminal', name: 'Terminal', manifest: { id: 'com.roni.terminal', name: 'Terminal', entry: 'app.html', permissions: ['proc.spawn'],          windowDefaults: { width: 720, height: 460 } } },
  { id: 'com.roni.settings', name: 'Settings', manifest: { id: 'com.roni.settings', name: 'Settings', entry: 'app.html', permissions: [],                      windowDefaults: { width: 720, height: 500 } } },
]

const filteredApps = computed(() =>
  query.value
    ? ALL_APPS.filter(a => a.name.toLowerCase().includes(query.value.toLowerCase()))
    : ALL_APPS
)

function toggleLauncher() {
  showLauncher.value = !showLauncher.value
  if (showLauncher.value) {
    query.value = ''
    nextTick(() => searchInput.value?.focus())
  }
}

function launch(app) {
  wm.launch(app.manifest)
  showLauncher.value = false
}

function launchFirst() {
  if (filteredApps.value.length) launch(filteredApps.value[0])
}

// ── Notifications ──────────────────────────────
function notify({ title, body, duration = 4000 }) {
  const id = crypto.randomUUID()
  notifications.value.push({ id, title, body })
  setTimeout(() => dismiss(id), duration)
}

function dismiss(id) {
  notifications.value = notifications.value.filter(n => n.id !== id)
}

// ── Expose to ShellLayer ───────────────────────
defineExpose({ toggleLauncher, notify })
</script>

<style scoped>
.overlay-layer {
  position: absolute;
  inset: 0;
  z-index: 200;
  pointer-events: none;
}

/* Launcher */
.launcher-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  pointer-events: all;
}

.launcher {
  width: 560px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-active);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 32px 80px rgba(0,0,0,0.6);
}

.launcher-search {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

.launcher-search input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-family: var(--font-ui);
  font-size: 15px;
  color: var(--text-primary);
  caret-color: var(--accent);
}
.launcher-search input::placeholder { color: var(--text-tertiary); }

.launcher-results {
  padding: 6px;
  max-height: 320px;
  overflow-y: auto;
}

.launcher-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  pointer-events: all;
  transition: background 0.1s;
}
.launcher-item:hover { background: var(--bg-overlay); }

.launcher-item-icon {
  width: 36px; height: 36px;
  border-radius: 9px;
  background: var(--accent-dim);
  border: 1px solid var(--accent-glow);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--accent);
  flex-shrink: 0;
}

.launcher-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.launcher-item-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.launcher-item-id   { font-size: 11px; color: var(--text-tertiary); font-family: var(--font-mono); }

.launcher-empty {
  padding: 24px;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 13px;
}

/* Notifications */
.notifications {
  position: absolute;
  top: calc(var(--panel-h) + 8px);
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  pointer-events: all;
  width: 300px;
}

.notification {
  background: var(--bg-elevated);
  border: 1px solid var(--border-active);
  border-radius: var(--radius);
  padding: 12px 14px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  transition: transform 0.15s;
}
.notification:hover { transform: translateX(-2px); }

.notif-body { display: flex; flex-direction: column; gap: 3px; }
.notif-title { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.notif-text  { font-size: 12px; color: var(--text-secondary); }

/* Transitions */
.launcher-enter-active, .launcher-leave-active { transition: opacity 0.15s, transform 0.15s; }
.launcher-enter-from, .launcher-leave-to { opacity: 0; transform: scale(0.97) translateY(-8px); }

.notif-enter-active { transition: opacity 0.2s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1); }
.notif-leave-active { transition: opacity 0.15s, transform 0.15s; }
.notif-enter-from { opacity: 0; transform: translateX(20px); }
.notif-leave-to   { opacity: 0; transform: translateX(20px); }
</style>
