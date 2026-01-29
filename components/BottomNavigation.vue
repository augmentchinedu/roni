<template>
  <nav
    class="fixed bottom-0 left-0 w-full bg-white shadow-t z-50 pb-safe md:h-30 lg:h-20"
    v-if="isVisible"
  >
    <div class="h-full flex justify-around items-center">
      <div
        v-for="(item, index) in navigation"
        :key="index"
        class="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-blue-600 active:scale-95 transition-all duration-150 cursor-pointer"
        @click="handleClick(item)"
      >
        <img
          :src="`https://storage.googleapis.com/great-unknown.appspot.com/icons/${item.icon.inactive}`"
          class="w-10 h-10"
        />
        <span class="text-[11px] md:text-2xl lg:text-xs mt-1 font-medium">
          {{ item.label }}
        </span>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useStore } from "../store";
import { useRouter } from "vue-router";
import { computed } from "vue";

// Access app store
const { app } = useStore();

const router = useRouter();

// Safely get bottom navigation array
const navigation = computed(
  () => app?.content?.navigation?.drawer?.bottom ?? []
);

// reactive computed for visibility
const isVisible = computed(() => {
  return app?.content?.navigation?.drawer?.bottom.length > 0;
});

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
