import { GraphQLClient } from 'graphql-request';

export const getGraphQLClient = (subgraphUrl) => {
  try {
    return new GraphQLClient(subgraphUrl);
  } catch (error) {
    throw new Error(`Failed to create GraphQLClient: ${error.message}`);
  }
};
