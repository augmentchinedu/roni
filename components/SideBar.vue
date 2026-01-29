<template>
  <!-- Sidebar -->
  <div
    v-if="isVisible"
    :class="[
      'bg-gray-800 text-white h-screen transition-all duration-300',
      isOpen ? 'w-64' : 'w-16',
    ]"
  >
    <button class="p-2 m-2 bg-gray-700 rounded" @click="toggleSidebar">
      {{ isOpen ? "Close" : "Open" }}
    </button>

    <ul v-if="isOpen" class="mt-4">
      <li class="p-2 hover:bg-gray-700 rounded">Home</li>
      <li class="p-2 hover:bg-gray-700 rounded">Profile</li>
      <li class="p-2 hover:bg-gray-700 rounded">Settings</li>
    </ul>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useStore } from "@/store";

const { app } = useStore();

// reactive computed for visibility
const isVisible = computed(() => {
  return app.content.navigation.sidebar.left.length > 0;
});

const isOpen = ref(true);

function toggleSidebar() {
  isOpen.value = !isOpen.value;
}
</script>

<style scoped>
/* optional: smooth width transition for sidebar */
div > div {
  transition: width 0.3s ease;
}
</style>
