import { Worker } from "bullmq";
import { prisma } from "../lib/prisma";
import { rebuildOfferSnapshotsForUser } from "../services/offers/offer-eligibility-projector";
import {
  OFFER_PROJECTION_JOB_REBUILD,
  OFFER_PROJECTION_JOB_RECOMPUTE_USER,
  OFFER_PROJECTION_QUEUE_NAME,
  type OfferProjectionJobPayload,
} from "../queue/offer-projection-queue";

const connection = {
  url: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
};

type OfferProjectionJobName =
  | typeof OFFER_PROJECTION_JOB_REBUILD
  | typeof OFFER_PROJECTION_JOB_RECOMPUTE_USER;

const getImpactedUsers = async (merchantIds?: string[]): Promise<string[]> => {
  const scopedMerchantIds = merchantIds ?? [];

  if (scopedMerchantIds.length === 0) {
    // No merchant filter means this is a global refresh, so we rebuild snapshots for every known user.
    const rows = await prisma.customerType.findMany({
      distinct: ["userId"],
      select: { userId: true },
    });
    return rows.map((row) => row.userId);
  }

  const rows = await prisma.customerType.findMany({
    where: {
      merchantId: {
        in: scopedMerchantIds,
      },
    },
    distinct: ["userId"],
    select: { userId: true },
  });

  return rows.map((row) => row.userId);
};

export const offerProjectionWorker = new Worker<OfferProjectionJobPayload>(
  OFFER_PROJECTION_QUEUE_NAME,
  async (job) => {
    const name = job.name as OfferProjectionJobName;
    const data = job.data as OfferProjectionJobPayload;
    const { userId, merchantIds } = data;
    type ProjectorClient = Parameters<typeof rebuildOfferSnapshotsForUser>[0];
    // The projector function is typed against the same Prisma client shape; this keeps the handoff explicit.
    const projectorPrisma = prisma as unknown as ProjectorClient;

    switch (name) {
      case OFFER_PROJECTION_JOB_RECOMPUTE_USER: {
        // Used when resolver detects stale rows for one user and wants a targeted refresh.
        if (!userId) {
          throw new Error("recompute-user-snapshots requires userId");
        }

        await rebuildOfferSnapshotsForUser(projectorPrisma, {
          userId,
          merchantIds,
        });
        return;
      }
      case OFFER_PROJECTION_JOB_REBUILD: {
        if (userId) {
          // Rebuild can still be scoped to one user (for event handlers that already know the user id).
          await rebuildOfferSnapshotsForUser(projectorPrisma, {
            userId,
            merchantIds,
          });
          return;
        }

        const userIds = await getImpactedUsers(merchantIds);
        // Alternative considered: batch users in chunks with Promise.allSettled for faster catch-up.
        // Kept sequential for now because it is gentler on Postgres during heavy write periods.
        // for (const chunk of chunkArray(userIds, 20)) await Promise.allSettled(chunk.map(...))
        // Fan-out through impacted users instead of one giant transaction to keep DB load predictable.
        for (const impactedUserId of userIds) {
          await rebuildOfferSnapshotsForUser(projectorPrisma, {
            userId: impactedUserId,
            merchantIds,
          });
        }
        return;
      }
      default: {
        throw new Error(`Unsupported offer projection job: ${name}`);
      }
    }
  },
  { connection, concurrency: 4 },
);
