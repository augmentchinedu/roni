<template>
  <div id="main" class="min-h-screen w-full flex relative">
    <SideBar v-if="isVisible" />

    <div class="pb-[72px] md:pb-20">
      <RouterView />
    </div>
    <!-- Fixed bottom nav -->
    <BottomNavigation />
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useStore } from "@/store";

import SideBar from "./components/SideBar.vue";
import BottomNavigation from "./components/BottomNavigation.vue";

const { app } = useStore();

// reactive computed for visibility
const isVisible = computed(() => {
  return app.content.navigation.sidebar.left.length > 0;
});
</script>
