// stores/useStore.js
import { reactive } from "vue";
import { defineStore } from "pinia";
import { client, gql } from "../gql/index.js";
import { USER_BASE_FIELDS } from "../gql/user.base.js";
import { USER_CLIENT_FIELDS } from "gql/user.js";

export const useStore = defineStore("store", () => {
  const app = reactive({
    id: null,
    name: null,
    isInitialized: false,
    isAuthenticated: () => !!localStorage.getItem("token"),
    content: {},
  });
  const user = reactive({});

  async function initialize() {
    if (app.isInitialized) return;

    console.log("Initializing...");

    const isDev = import.meta.env.MODE === "development";

    const variables = isDev
      ? {
          username: __USERNAME__,
          key: import.meta.env.VITE_DEVELOPMENT_KEY,
        }
      : {};

    try {
      const { client: clientData } = await client.request(
        gql`
          query GetClient($username: String, $key: String) {
            client(username: $username, key: $key) {
              id
              name
              username
              type
              content
            }
          }
        `,
        variables
      );

      Object.assign(app, clientData);
      app.isAuthenticated = !!localStorage.getItem("token");
      app.isInitialized = true;

      if (app.isAuthenticated || true) {
        const { user: userData } = await client.request(gql`
          ${USER_BASE_FIELDS}
          ${USER_CLIENT_FIELDS}

          query GetUser {
            user {
              ...UserBaseFields
              ...UserFields
            }
          }
        `);

        Object.assign(user, userData);
        console.log(user);
      }

      console.info("Initialized via GraphQL client", app);
    } catch (err) {
      console.error("GraphQL error:", err);
    }
  }

  return { app, user, initialize };
});
