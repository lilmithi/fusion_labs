import type { PrismaClient } from "@prisma/client";
import type { Queue } from "bullmq";

export type GraphQLContext = {
  prisma: PrismaClient;
  authSession: {
    userId: string;
  };
  offerProjectionQueue: Queue;
};
