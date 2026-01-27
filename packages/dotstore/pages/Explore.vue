<template>
  <header class="text-center">
    <div>
      <span class="font-bold text-3xl">Explore</span>
    </div>
    <div>
      <span class="font-bold text-3xl">Search</span>
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
import { useStore } from "../../../store";

const { app } = useStore();
const { explore } = app;
</script>
