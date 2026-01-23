<template>
  <h1>Welcome to {{ app.name }}:{{ appName }}!</h1>
  <RouterView />
  <div>Pinia installed</div>
</template>

<script setup>
import { useStore } from "./store";

const { app } = useStore();
const appName = PROJECT.id;
</script>

<style>
h1 {
  color: #4caf50;
  font-family: sans-serif;
}
</style>
