// graphqlClient.js
import { GraphQLClient, gql } from "graphql-request";

const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT;

console.log(endpoint);
// TGU apps use the same client endpoint
export const client = new GraphQLClient(endpoint, {
  credentials: "include", // send cookies for auth if needed
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

// Export gql for writing queries
export { gql };
