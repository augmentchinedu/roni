<template>
  <div>
    <header class="flex justify-between p-2 shadow-sm">
      <div></div>
      <div class="flex gap-1">
        <button
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Sign Up
        </button>
        <button
          class="bg-green-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Sign In
        </button>
      </div>
    </header>
    <div class="w-full min-h-screen flex justify-center items-center">
      <div
        class="rounded-lg p-6 flex flex-col items-center bg-white shadow-md hover:shadow-lg transition"
      >
        <img :src="game.image" :alt="game.name" class="rounded w-64 mb-4" />
        <div class="text-center font-semibold text-lg mb-4">
          {{ game.name }}
        </div>
        <button
          class="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition"
          @click="goToBoard"
        >
          Play {{ game.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";
import { useStore } from "@/store";

const { app } = useStore();
const router = useRouter();
const route = useRoute();
const gameId = route.params.id;

// Find the game by ID
const game = app.content.games.find((game) => game.id === gameId);

function goToBoard() {
  router.push({
    name: "board",
  });
}
</script>
