<template>
  <h3>{{ app.id }}</h3>
  <RouterView />
</template>

<script setup>
import { useStore } from "./store";

const { app } = useStore();
</script>
