import type { PrismaClient } from "../../../../generated/prisma/client";
import { queueOfferProjection } from "../../queue/offer-projection-queue";
import { rebuildOfferSnapshotsForUser } from "./offer-eligibility-projector";

export const handleCustomerTypeMutation = async (
  prisma: PrismaClient,
  userId: string,
  merchantId: string,
): Promise<void> => {
  // This mutation impacts one user deterministically, so we refresh immediately for consistency.
  await rebuildOfferSnapshotsForUser(prisma, {
    userId,
    merchantIds: [merchantId],
  });
};

export const handleOfferMutation = async (merchantId: string): Promise<void> => {
  // Offer edits can fan out to many users, so we enqueue background rebuild work.
  await queueOfferProjection({
    reason: "offer-updated",
    merchantIds: [merchantId],
  });
};

export const handleMerchantMutation = async (merchantId: string): Promise<void> => {
  await queueOfferProjection({
    reason: "merchant-updated",
    merchantIds: [merchantId],
  });
};
