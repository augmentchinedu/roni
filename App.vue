<template>
  <div id="main" class="relative min-h-screen">
    <!-- Scrollable content -->
    <div class="pb-16">
      <!-- padding-bottom equal to nav height -->
      <RouterView />
    </div>

    <!-- Fixed bottom nav -->
    <BottomNavigation class="fixed bottom-0 left-0 w-full z-50" />
  </div>
</template>

<script setup>
import BottomNavigation from "./components/BottomNavigation.vue";
</script>
