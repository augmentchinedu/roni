<template>
  <!-- Overlay (mobile only) -->
  <div
    v-if="isOpen && isMobile"
    class="fixed inset-0 bg-black/50 z-40"
    @click="toggleSidebar"
  ></div>

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed md:static top-0 left-0 h-screen bg-red-800 text-white z-50 transition-all duration-300',
      isMobile
        ? isOpen
          ? 'w-64 translate-x-0'
          : 'w-64 -translate-x-full'
        : isOpen
        ? 'w-64'
        : 'w-16',
    ]"
  >
    <!-- Toggle -->
    <button class="p-2 m-2 bg-gray-700 rounded" @click="toggleSidebar">
      ☰
    </button>

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
import { computed, ref } from "vue";
import { useStore } from "@/store";

const { app } = useStore();

const isOpen = ref(true);

function toggleSidebar() {
  isOpen.value = !isOpen.value;
}

const menu = computed(() => app.content.navigation.sidebar.left);
</script>

<style scoped>
/* optional: smooth width transition for sidebar */
div > div {
  transition: width 0.3s ease;
}
</style>
