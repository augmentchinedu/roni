<template>
  <div id="desktop">
    <div class="wallpaper" />
    <div class="shell">
      <span>Roni OS — compositor running ✓</span>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { bus } from './bus/RoniBus.js'

onMounted(async () => {
  try {
    await bus.connect()
  } catch (e) {
    console.warn('[compositor] Bus not available in dev:', e.message)
  }
})
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app, #desktop {
  width: 100vw; height: 100vh; overflow: hidden;
}
.wallpaper {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a2e 100%);
}
.shell {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.8);
  font-family: system-ui, sans-serif;
  font-size: 1.2rem;
  letter-spacing: 0.1em;
}
</style>
