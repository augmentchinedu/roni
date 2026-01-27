// graphqlClient.js
import { GraphQLClient, gql } from "graphql-request";

const endpoint =
  import.meta.env.MODE == "development"
    ? "http://localhost:3000/graphql"
    : "https://" + window.location.host + "/graphql";

console.log(endpoint);
// TGU apps use the same client endpoint
export const client = new GraphQLClient(endpoint, {
  credentials: "include", // send cookies for auth if needed
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});
console.log(client);

// Export gql for writing queries
export { gql };
