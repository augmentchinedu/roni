import { reactive } from "vue";
import { defineStore } from "pinia";

export const useStore = defineStore("store", () => {
  const { id, name } = PROJECT;

  const app = reactive({
    id,
    name,
  });

  const user = reactive({});

  return { app, user };
});
