<template>
  <nav class="fixed bottom-0 left-0 w-full bg-white shadow-t z-50">
    <div class="flex justify-around items-center h-16">
      <div
        v-for="(item, index) in navigation"
        :key="index"
        class="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
        @click="handleClick(item)"
      >
        <!-- Icon (use item.icon if available) -->
        <span v-if="item.icon" class="text-2xl mb-1">
          <i class="material-icons">{{ item.icon }}</i>
        </span>
        <!-- Label -->
        <span class="text-xs">{{ item }}</span>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useStore } from "@/store";
import { ref, computed } from "vue";

// Access app store
const { app } = useStore();

// Safely get bottom navigation array
const navigation = computed(
  () => app?.content?.navigation?.drawer?.bottom ?? []
);

// Click handler for nav items
function handleClick(item) {
  if (item.route) {
    // Use Vue Router to navigate if route is defined
    // Note: needs useRouter
    router.push(item.route);
  } else if (item.action) {
    // Call any custom action
    item.action();
  }
}
</script>

<style>
/* Optional shadow on top to distinguish nav from content */
.shadow-t {
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}
</style>
