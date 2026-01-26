// graphqlClient.js
import { GraphQLClient, gql } from "graphql-request";

// TGU apps use the same client endpoint
export const client = new GraphQLClient("http://localhost:3000/graphql", {
  credentials: "include", // send cookies for auth if needed
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

// Export gql for writing queries
export { gql };
