<template>
  <div id="desktop">
    <!-- Layer 0: Wallpaper -->
    <div class="wallpaper">
      <div class="wallpaper-mesh" />
      <div class="wallpaper-grain" />
    </div>

    <!-- Layer 1: Windows -->
    <WindowLayer />

    <!-- Layer 2: Shell (Panel + Dock) -->
    <ShellLayer />

    <!-- Layer 3: Overlays live inside ShellLayer -->
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { bus } from './bus/RoniBus.js'
import WindowLayer from './layers/WindowLayer.vue'
import ShellLayer from './layers/ShellLayer.vue'

onMounted(async () => {
  try {
    await bus.connect()
  } catch (e) {
    console.warn('[compositor] Bus not available:', e.message)
  }
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

:root {
  --bg-base:        #080b10;
  --bg-surface:     #0e1219;
  --bg-elevated:    #141921;
  --bg-overlay:     #1a2130;
  --border:         rgba(255,255,255,0.06);
  --border-active:  rgba(255,255,255,0.12);
  --text-primary:   rgba(255,255,255,0.92);
  --text-secondary: rgba(255,255,255,0.45);
  --text-tertiary:  rgba(255,255,255,0.22);
  --accent:         #4f8ef7;
  --accent-glow:    rgba(79,142,247,0.25);
  --accent-dim:     rgba(79,142,247,0.12);
  --danger:         #f7604f;
  --warn:           #f7b84f;
  --ok:             #4ff7a0;
  --panel-h:        32px;
  --dock-h:         64px;
  --radius:         10px;
  --radius-sm:      6px;
  --shadow-window:  0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06);
  --font-ui:        'DM Sans', system-ui, sans-serif;
  --font-mono:      'DM Mono', monospace;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  width: 100vw; height: 100vh;
  overflow: hidden;
  background: var(--bg-base);
  font-family: var(--font-ui);
  font-size: 13px;
  user-select: none;
  -webkit-user-select: none;
  cursor: default;
  -webkit-font-smoothing: antialiased;
}

#desktop {
  width: 100vw; height: 100vh;
  position: relative;
  overflow: hidden;
}

.wallpaper {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(ellipse 80% 60% at 20% 80%, rgba(20,40,90,0.5) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,20,70,0.4) 0%, transparent 55%),
    radial-gradient(ellipse 100% 100% at 50% 50%, #080b10 40%, #0a0d16 100%);
}

.wallpaper-mesh {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(79,142,247,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79,142,247,0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 80%);
}

.wallpaper-grain {
  position: absolute;
  inset: 0;
  opacity: 0.4;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
  background-size: 200px 200px;
}
</style>
