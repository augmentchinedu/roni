<template>
  <div id="page">
    <home></home>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from "vue";
import { useStore } from "@/store";

const { app } = useStore();

const client = app.username; // could come from server, username, or host
const Home = defineAsyncComponent(() => import(`../views/${client}/Home.vue`));
</script>
