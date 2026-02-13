import type { Outlet } from "../../../../../generated/prisma/client";
import type { GraphQLContext } from "../../context";
import { OFFER_PROJECTION_JOB_RECOMPUTE_USER } from "../../../queue/offer-projection-contracts";
import { buildOfferSnapshotFilters } from "./helpers/offers/filters";
import type { OffersQueryInput } from "./helpers/offers/types";

const STALE_SNAPSHOT_SECONDS = 120;

type OffersResolverArgs = {
  input: OffersQueryInput;
  first?: number;
  skip?: number;
};

export const offers = async (
  _parent: unknown,
  args: OffersResolverArgs,
  ctx: GraphQLContext,
): Promise<Outlet[]> => {
  const { prisma, authSession, offerProjectionQueue } = ctx;
  const first = Math.min(args.first ?? 25, 100);

  // Read from the precomputed snapshot table so this resolver stays fast under heavy traffic.
  const snapshots = await prisma.offerEligibilitySnapshot.findMany({
    where: buildOfferSnapshotFilters(authSession.userId, args.input),
    include: {
      Outlet: {
        include: {
          Merchant: true,
        },
      },
    },
    take: first,
    skip: args.skip,
    orderBy: [{ updatedAt: "desc" }, { outletId: "asc" }],
  });

  const staleThreshold = new Date(Date.now() - STALE_SNAPSHOT_SECONDS * 1_000);
  // We never block the response for refresh; stale rows trigger an async recompute job.
  const staleMerchantIds = new Set(
    snapshots
      .filter((snapshot) => snapshot.lastComputedAt < staleThreshold)
      .map((snapshot) => snapshot.merchantId),
  );

  if (staleMerchantIds.size > 0) {
    // Thought process: I initially considered refreshing inline here, but that makes tail latency unpredictable.
    // await rebuildOfferSnapshotsForUser(prisma, { userId: authSession.userId, merchantIds: [...staleMerchantIds] });

    await offerProjectionQueue.add(
      OFFER_PROJECTION_JOB_RECOMPUTE_USER,
      {
        userId: authSession.userId,
        merchantIds: [...staleMerchantIds],
      },
      {
        removeOnComplete: true,
        removeOnFail: 100,
        jobId: `recompute:${authSession.userId}:${[...staleMerchantIds].sort().join(",")}`,
      },
    );
  }

  // Handy when diagnosing weird result sets during local testing.
  // console.debug("offers:snapshot-count", snapshots.length, "user", authSession.userId);
  return snapshots.map((snapshot) => snapshot.Outlet);
};
