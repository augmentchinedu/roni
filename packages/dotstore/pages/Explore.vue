<template>
  <header class="w-full text-center text-lg">
    <div>
      <span class="font-bold">Explore</span>
    </div>
    <div>
      <span class="font-bold">Search</span>
    </div>
  </header>
  <main>
    <div
      v-for="tag in explore"
      :key="tag.id"
      class="w-[90%] text-center mx-auto py-10"
    >
      {{ tag.name }}
    </div>
  </main>
</template>

<script setup>
import { useStore } from "@/store";

const { app } = useStore();
const { explore } = app;
</script>
