// gql//user.js
import { gql } from "graphql-request";

export const USER_CLIENT_FIELDS = gql`
  fragment UserFields on User {
    transactions
  }
`;
