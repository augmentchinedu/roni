<template>
  <div class="w-full p-4">
    <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <router-link
        :to="`/${game.id}`"
        v-for="game in games"
        :key="game.id"
        class="border rounded-lg p-4 flex flex-col items-center hover:shadow-lg transition text-lg"
      >
        <img :src="game.image" :alt="game.name" class="rounded w-full mb-2" />
        <div class="text-center font-semibold">{{ game.name }}</div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { useStore } from "@/store";

const { app } = useStore();
const { games } = app.content;
console.log(app);
</script>
