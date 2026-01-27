<template>
  <nav class="fixed bottom-0 left-0 w-full bg-white shadow-md z-50">
    <div class="flex justify-around items-center h-16">
      <div
        v-for="(item, index) in navigation"
        :key="index"
        class="flex flex-col items-center"
      >
        <!-- Replace this with icon if needed -->
        <span class="text-sm">{{ item }}</span>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useStore } from "@/store";

const { app } = useStore();

// Make sure navigation exists before reading it
const navigation = app?.content?.navigation?.drawer?.bottom ?? [];
</script>

<style>
/* Optional: add hover effect for items */
nav div:hover {
  color: #2563eb; /* Tailwind blue-600 */
}
</style>
