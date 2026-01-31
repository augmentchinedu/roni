<!-- Sidebar.vue -->
<template>
  <!-- Overlay (mobile only) -->
  <div
    v-if="isOpen && isMobile"
    class="fixed inset-0 bg-black/50 z-40"
    @click="closeSidebar"
  ></div>

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed md:static top-0 left-0 h-screen bg-red-800 text-white z-50 transition-all duration-300',
      sidebarWidthClass,
    ]"
  >
    <!-- Menu -->
    <ul v-if="isOpen" class="w-full mt-4">
      <li
        v-for="(item, index) in menu"
        :key="index"
        class="p-2 hover:bg-gray-700 rounded cursor-pointer"
      >
        {{ item.label }}
      </li>
    </ul>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useStore } from "@/store";
import { useEventBus } from "@vueuse/core";

const { app } = useStore();
const bus = useEventBus("nav");

// Sidebar state
const isOpen = ref(false);
const isMobile = ref(false);

// Menu data
const menu = computed(() => app.content.navigation.sidebar.left);

// Compute sidebar width/translate classes
const sidebarWidthClass = computed(() => {
  if (isMobile.value) {
    return isOpen.value ? "w-64 translate-x-0" : "w-64 -translate-x-full";
  }
  return isOpen.value ? "w-64" : "w-16";
});

// Toggle function
function closeSidebar() {
  isOpen.value = false;
}

bus.on(() => {
  isOpen.value = !isOpen.value; // toggle
});

// Detect mobile
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
  if (!isMobile.value) isOpen.value = true; // always open on desktop
};

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
});
</script>
