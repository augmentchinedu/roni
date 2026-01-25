import { reactive } from "vue";
import { defineStore } from "pinia";

export const useStore = defineStore("store", () => {
  const { id, name } = PROJECT;

  const app = reactive({
    id,
    name,
    isInitialized: false,
  });

  const user = reactive({});

  function initialize() {
    if (app.isInitialized) return;
    console.log("Initializing...");

    const data = {
      name: "velar",
      explore: [
        { id: "womens-suit", name: "Women's Suit" },
        { id: "designer-collection", name: "Designer Collection" },
        { id: "spring-collection", name: "Spring Collection" },
        { id: "new-arrivals", name: "New Arrivals" },
        { id: "top-trends", name: "Top Trends" },
      ],
    };

    Object.assign(app, data);

    console.log(app);

    app.isInitialized = true;

    console.info("Initialized");
  }

  return { app, user, initialize };
});
