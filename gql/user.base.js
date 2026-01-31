// gql/user.base.js
import { gql } from "graphql-request";

export const USER_BASE_FIELDS = gql`
  fragment UserBaseFields on User {
    id
    username
    email
  }
`;
