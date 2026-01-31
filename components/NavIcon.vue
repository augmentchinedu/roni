<script setup>
import { useEventBus } from "@vueuse/core";

const bus = useEventBus("nav");

function toggleNav() {
  // emit a toggle event
  bus.emit("nav-toggle"); 
}
</script>

<template>
  <button
    class="flex flex-col justify-center items-center gap-1 w-8 h-8"
    @click="toggleNav"
  >
    <span class="w-6 h-0.5 bg-black"></span>
    <span class="w-6 h-0.5 bg-black"></span>
    <span class="w-6 h-0.5 bg-black"></span>
  </button>
</template>
