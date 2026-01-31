<template>
  <div id="chess" class="flex flex-col gap-4 p-2">
    
    <profile-bar></profile-bar>
    <div
      ref="board"
      class="grid grid-cols-8 grid-rows-8 w-96 h-96 border border-black mx-auto"
    ></div>
    <profile-bar></profile-bar>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { createBoard, createPieces } from "../../js/chess";
import ProfileBar from "./components/ProfileBar.vue";
const board = ref(null);

onMounted(() => {
  // 1️⃣ Create board squares
  createBoard(board);
  createPieces(board);
});
</script>

<style>
.square {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

/* Dark squares */
.black {
  background-color: rgb(150 176 125);
}

/* Light squares */
.white {
  background-color: rgb(240 241 220);
}

.piece {
  width: 80%;
  height: 80%;
  pointer-events: none;
  user-select: none;
}
</style>
