<template>
  <div class="w-full p-4">
    <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <div
        v-for="game in games"
        :key="game.id"
        class="border rounded-lg p-4 flex flex-col items-center hover:shadow-lg transition text-4xl lg:text-xl"
      >
        <img :src="game.image" :alt="game.name" class="rounded w-full mb-2" />
        <div class="text-center font-semibold">{{ game.name }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const games = [
  {
    id: "chess",
    name: "Chess",
    image:
      "https://storage.googleapis.com/great-unknown.appspot.com/images/games/chess/cover.png",
  },
  {
    id: "ludo",
    name: "Ludo",
    image:
      "https://storage.googleapis.com/great-unknown.appspot.com/images/games/ludo/cover.png",
  },
  {
    id: "monopoly",
    name: "Monopoly",
    image:
      "https://storage.googleapis.com/great-unknown.appspot.com/images/games/monopoly/cover.png",
  },
];
</script>
