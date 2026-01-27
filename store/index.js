// stores/useStore.js
import { reactive } from "vue";
import { defineStore } from "pinia";
import { client, gql } from "../gql/index.js";

export const useStore = defineStore("store", () => {
  const { name, username, package: pkg } = PROJECT;

  const app = reactive({
    id: null,
    name,
    username,
    isInitialized: false,
  });

  const user = reactive({});

  async function initialize() {
    if (app.isInitialized) return;

    console.log("Initializing...", username);

    const isDev =
      import.meta.env.MODE === "development" ||
      window.location.hostname === "localhost" ||
      window.location.hostname.includes("cloudworkstations.dev");

    const variables = {
      username: import.meta.env.VITE_DEVELOPMENT_KEY ? username : null,
    };

    const query = gql`
      query GetClient($username: String) {
        client(username: $username) {
          id
          name
          username
        }
      }
    `;

    try {
      const data = await client.request(query, variables);
      console.log("GraphQL response:", data);

      // Merge client data into app
      Object.assign(app, data.client);

      app.isInitialized = true;
      console.info("Initialized via GraphQL client");
    } catch (err) {
      console.error("GraphQL error:", err);
    }
  }

  return { app, user, initialize };
});
