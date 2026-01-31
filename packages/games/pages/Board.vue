<template>
  <div id="game" class="w-full text-center">
    <!-- Chess = HTML/Vue game -->
    <component v-if="gameID === 'chess'" :is="GameComponent" />

    <!-- Others = ThreeJS canvas -->
    <div v-else ref="canvasContainer" class="w-full h-screen" />
  </div>
</template>

<script setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  defineAsyncComponent,
  computed,
} from "vue";
import { useRoute } from "vue-router";
import { createGame } from "../js";

const route = useRoute();
const gameID = route.params.id;
const canvasContainer = ref(null);
let cleanup = null;

/* ---------------- HTML Games ---------------- */

const htmlGames = ["chess"];

const GameComponent = computed(() =>
  defineAsyncComponent(() => import(`../views/${gameID}/Index.vue`))
);

/* ---------------- ThreeJS Games ---------------- */

onMounted(async () => {
  if (!htmlGames.includes(gameID)) {
    cleanup = await createGame(gameID, canvasContainer.value);
  }
});

onBeforeUnmount(() => {
  if (cleanup) cleanup();
});
</script>
