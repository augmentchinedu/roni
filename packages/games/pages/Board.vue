<template>
  <div id="page" class="w-full">
    <game-board class="w-full"></game-board>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const gameId = route.params.id;

const GameBoard = defineAsyncComponent(() =>
  import(`../views/${gameId}/Board.vue`)
);
</script>
