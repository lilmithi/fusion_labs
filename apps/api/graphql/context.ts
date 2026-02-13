import type { prisma } from "../lib/prisma";
import type { Queue } from "bullmq";

export type GraphQLContext = {
  prisma: typeof prisma;
  authSession: {
    userId: string;
  };
  offerProjectionQueue: Queue;
};
