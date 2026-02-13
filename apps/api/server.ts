import { createYoga } from "graphql-yoga";
import { prisma } from "./lib/prisma";
import { offerProjectionQueue } from "./queue/offer-projection-queue";
import { schema } from "./graphql/schema";

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/graphql",
  context: async ({ request }) => {
    // For local/dev usage we accept a header override so you can query offers as different users quickly.
    // If the header is missing just fallback to demo user
    const userId = request.headers.get("x-user-id") ?? "user_alice";

    return {
      prisma,
      authSession: { userId },
      offerProjectionQueue,
    };
  },
});

const port = Number(process.env.PORT ?? 3000);

Bun.serve({
  port,
  fetch: yoga,
});

console.log(`GraphQL API running at http://localhost:${port}/graphql`);
