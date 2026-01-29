<template>
  <div class="w-full">
    <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <div
        class="border rounded-lg p-4 flex flex-col items-center hover:shadow-lg transition text-4xl lg:text-xl"
      >
        <img :src="game.image" :alt="game.name" class="rounded w-full mb-2" />
        <div class="text-center font-semibold">{{ game.name }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { useStore } from "@/store";

const { app } = useStore();

const route = useRoute();
const gameId = route.params.id;

const game = app.content.games.find((game) => game.id === gameId);
</script>
