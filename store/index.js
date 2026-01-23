import { reactive } from "vue";
import { defineStore } from "pinia";

export const useStore = defineStore("store", () => {
  const app = reactive({
    name: "App Name",
  });

  const user = reactive({});

  return { app, user };
});
