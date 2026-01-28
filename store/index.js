// stores/useStore.js
import { reactive } from "vue";
import { defineStore } from "pinia";
import { client, gql } from "../gql/index.js";

export const useStore = defineStore("store", () => {
  const app = reactive({
    id: null,
    name,
    isInitialized: false,
  });

  const user = reactive({});

  async function initialize() {
    if (app.isInitialized) return;

    console.log("Initializing...");

    const variables = {
      username: import.meta.env.VITE_DEVELOPMENT_KEY
        ? import.meta.env.VITE_USERNAME
        : null,
      key:
        import.meta.env.MODE === "development"
          ? import.meta.env.VITE_DEVELOPMENT_KEY
          : null,
    };

    const query = gql`
      query GetClient($username: String, $key: String) {
        client(username: $username, key: $key) {
          id
          name
          username
          content
        }
      }
    `;

    try {
      const data = await client.request(query, variables);

      // Merge client data into app
      Object.assign(app, data.client);
      app.isInitialized = true;

      console.info("Initialized via GraphQL client", app);
    } catch (err) {
      console.error("GraphQL error:", err);
    }
  }

  return { app, user, initialize };
});
