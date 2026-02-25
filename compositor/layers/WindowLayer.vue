<template>
  <div class="window-layer">
    <TransitionGroup name="window">
      <WindowFrame
        v-for="win in wm.windowList"
        :key="win.id"
        :win="win"
      />
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useWindowStore } from '../wm/WindowManager.js'
import WindowFrame from '../wm/WindowFrame.vue'

const wm = useWindowStore()
</script>

<style scoped>
.window-layer {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}
.window-layer > * { pointer-events: all; }

/* Window open/close transitions */
.window-enter-active {
  transition: opacity 0.18s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1);
}
.window-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.window-enter-from {
  opacity: 0;
  transform: scale(0.94);
}
.window-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
