<template>
  <div id="chess" class="flex justify-center items-center">
    <div
      ref="board"
      class="grid grid-cols-8 grid-rows-8 w-96 h-96 border border-black"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const board = ref(null);

onMounted(() => {
  // 1️⃣ Create board squares
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.className =
        (row + col) % 2 === 0 ? "white square" : "black square";
      board.value.appendChild(square);
    }
  }

  // 2️⃣ Add pieces
  const pieces = {
    0: ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
    1: ["♟", "♟", "♟", "♟", "♟", "♟", "♟", "♟"],
    6: ["♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙"],
    7: ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"],
  };

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = board.value.children[row * 8 + col];
      if (pieces[row]) {
        square.textContent = pieces[row][col];
      }
    }
  }
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
</style>
