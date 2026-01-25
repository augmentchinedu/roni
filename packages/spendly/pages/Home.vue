<template>
  <div>
    {{ app.name }}
  </div>
</template>

<script setup>
import { useStore } from "@/store";

const { app } = useStore();
</script>
