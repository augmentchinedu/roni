<template>
  <div class="shell-layer">
    <Panel @launcher="overlayRef?.toggleLauncher()" />
    <Dock />
    <OverlayLayer ref="overlayRef" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Panel from '../shell/Panel.vue'
import Dock from '../shell/Dock.vue'
import OverlayLayer from './OverlayLayer.vue'

const overlayRef = ref(null)
</script>

<style scoped>
.shell-layer {
  position: absolute;
  inset: 0;
  z-index: 100;
  pointer-events: none;
}
.shell-layer > * { pointer-events: all; }
</style>
