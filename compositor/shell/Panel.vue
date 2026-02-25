<template>
  <div class="panel">
    <!-- Left: App menu + active app name -->
    <div class="panel-left">
      <button class="panel-logo" @click="$emit('launcher')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="6" height="6" rx="1.5" fill="var(--accent)"/>
          <rect x="9" y="1" width="6" height="6" rx="1.5" fill="var(--text-tertiary)"/>
          <rect x="1" y="9" width="6" height="6" rx="1.5" fill="var(--text-tertiary)"/>
          <rect x="9" y="9" width="6" height="6" rx="1.5" fill="var(--text-tertiary)"/>
        </svg>
      </button>
      <span class="panel-app-name">{{ activeAppName }}</span>
    </div>

    <!-- Center: Clock -->
    <div class="panel-center">
      <span class="panel-clock">{{ time }}</span>
    </div>

    <!-- Right: System tray -->
    <div class="panel-right">
      <div class="tray-item" title="Network">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 11.5a1 1 0 100-2 1 1 0 000 2z" fill="var(--text-secondary)"/>
          <path d="M4.2 8.8a4 4 0 015.6 0" stroke="var(--text-secondary)" stroke-width="1.2" stroke-linecap="round" fill="none"/>
          <path d="M1.5 6.2a7 7 0 0111 0" stroke="var(--text-tertiary)" stroke-width="1.2" stroke-linecap="round" fill="none"/>
        </svg>
      </div>
      <div class="tray-item" title="Battery">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="4" width="10" height="6" rx="1.5" stroke="var(--text-secondary)" stroke-width="1.2"/>
          <rect x="11.5" y="5.5" width="1.5" height="3" rx="0.75" fill="var(--text-secondary)"/>
          <rect x="2.2" y="5.2" width="6" height="3.6" rx="0.8" fill="var(--ok)"/>
        </svg>
      </div>
      <div class="tray-divider" />
      <span class="tray-item panel-date">{{ date }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useWindowStore } from '../wm/WindowManager.js'

defineEmits(['launcher'])

const wm = useWindowStore()
const now = ref(new Date())
let ticker = null

onMounted(() => { ticker = setInterval(() => now.value = new Date(), 1000) })
onUnmounted(() => clearInterval(ticker))

const time = computed(() => now.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
const date = computed(() => now.value.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }))
const activeAppName = computed(() => wm.focused?.title ?? 'Roni')
</script>

<style scoped>
.panel {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: var(--panel-h);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  background: rgba(8,11,16,0.85);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid var(--border);
}

.panel-left, .panel-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.panel-right { justify-content: flex-end; }
.panel-center { flex: 0; white-space: nowrap; }

.panel-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px; height: 28px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s;
}
.panel-logo:hover { background: var(--bg-overlay); }

.panel-app-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  padding: 0 4px;
  letter-spacing: 0.01em;
}

.panel-clock {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: 0.05em;
}

.tray-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  height: 22px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.12s;
  color: var(--text-secondary);
  font-size: 11px;
}
.tray-item:hover { background: var(--bg-overlay); }

.tray-divider {
  width: 1px; height: 14px;
  background: var(--border);
  margin: 0 3px;
}

.panel-date {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-secondary);
  letter-spacing: 0.02em;
  cursor: default;
}
.panel-date:hover { background: transparent; }
</style>
