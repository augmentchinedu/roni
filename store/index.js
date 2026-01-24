import { reactive } from "vue";
import { defineStore } from "pinia";

const { id, name } = PROJECT;

export const useStore = defineStore("store", () => {
  const app = reactive({
    id,
    name,
  });

  const user = reactive({});

  return { app, user };
});
