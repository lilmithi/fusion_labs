import { createSchema } from "graphql-yoga";
import { offers } from "./resolvers/user/offers";

export const schema = createSchema({
  // Keep the schema backward-compatible with the existing offers query shape.
  typeDefs: /* GraphQL */ `
    enum CashbackPercentageFilters {
      UNDER_5
      FROM_5_TO_10
      ABOVE_10
    }

    input OffersQueryInput {
      search: String
      category: String
      percentage: CashbackPercentageFilters
    }

    type Merchant {
      id: ID!
      businessName: String!
      description: String
      category: String!
      status: String!
    }

    type Outlet {
      id: ID!
      name: String!
      description: String
      merchantId: String!
      Merchant: Merchant!
    }

    type Query {
      offers(input: OffersQueryInput, first: Int = 25, skip: Int = 0): [Outlet!]!
    }
  `,
  resolvers: {
    Query: {
      offers,
    },
  },
});
