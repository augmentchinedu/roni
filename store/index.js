// stores/useStore.js
import { reactive } from "vue";
import { defineStore } from "pinia";
import { client, gql } from "../gql/index.js";

export const useStore = defineStore("store", () => {
  const { id, name } = PROJECT;

  const app = reactive({
    id,
    name,
    isInitialized: false,
  });

  const user = reactive({});

  async function initialize() {
    if (app.isInitialized) return;

    console.log("Initializing...");

    const query = gql`
      query GetClient($username: String!) {
        client(username: $username) {
          id
          username
          name
        }
      }
    `;

    const variables = { username: "velar" };

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
