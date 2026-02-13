import { Queue } from "bullmq";
const connection = {
  url: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
};

export const OFFER_PROJECTION_QUEUE_NAME = "offer-projection" as const;
export const OFFER_PROJECTION_JOB_REBUILD = "rebuild-offer-snapshots" as const;
export const OFFER_PROJECTION_JOB_RECOMPUTE_USER = "recompute-user-snapshots" as const;

export const offerProjectionQueue = new Queue(OFFER_PROJECTION_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

export type OfferProjectionJobPayload = {
  userId?: string;
  merchantIds?: string[];
  reason: "customer-type-updated" | "offer-updated" | "merchant-updated" | "scheduled-refresh";
};

export type OfferProjectionJobName =
  | typeof OFFER_PROJECTION_JOB_REBUILD
  | typeof OFFER_PROJECTION_JOB_RECOMPUTE_USER;

export const queueOfferProjection = async (payload: OfferProjectionJobPayload): Promise<void> => {
  // Same reason + same scope should map to one enqueued job so rapid updates don't flood the worker.
  const stableKey = `${payload.reason}:${payload.userId ?? "all"}:${(payload.merchantIds ?? []).sort().join(",")}`;

  await offerProjectionQueue.add(OFFER_PROJECTION_JOB_REBUILD, payload, {
    jobId: stableKey,
  });
};
