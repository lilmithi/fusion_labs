export const OFFER_PROJECTION_QUEUE_NAME = "offer-projection" as const;
export const OFFER_PROJECTION_JOB_REBUILD = "rebuild-offer-snapshots" as const;
export const OFFER_PROJECTION_JOB_RECOMPUTE_USER = "recompute-user-snapshots" as const;

export type OfferProjectionJobPayload = {
  userId?: string;
  merchantIds?: string[];
  reason: "customer-type-updated" | "offer-updated" | "merchant-updated" | "scheduled-refresh";
};

export type OfferProjectionJobName =
  | typeof OFFER_PROJECTION_JOB_REBUILD
  | typeof OFFER_PROJECTION_JOB_RECOMPUTE_USER;
