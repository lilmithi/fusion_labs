import type {
  CashbackConfiguration,
  CustomerType,
  ExclusiveOffer,
  LoyaltyProgram,
  Outlet,
  PrismaClient,
} from "../../../../generated/prisma/client";
import {
  hasApprovedReview,
  isBudgetAvailable,
  isEligibleByCustomerType,
  isLoyaltyTierEligible,
  isWithinDateWindow,
} from "../../graphql/resolvers/user/helpers/offers/eligibility";

type ProjectionOptions = {
  userId: string;
  merchantIds?: string[];
  now?: Date;
};

type OutletBase = Outlet & {
  Merchant: {
    id: string;
    status: string;
  };
  PaybillOrTills: Array<{
    isActive: boolean;
    deletedAt: Date | null;
    Review: { status: string } | null;
  }>;
  Review: { status: string } | null;
};

type CashbackWithTiers = CashbackConfiguration & {
  Review: { status: string } | null;
  CashbackConfigurationTiers: Array<{
    percentage: unknown;
    isActive: boolean;
    deletedAt: Date | null;
    Review: { status: string } | null;
  }>;
  Outlets: Array<{ id: string }>;
};

type ExclusiveWithOutlet = ExclusiveOffer & {
  Review: { status: string } | null;
  Outlets: Array<{ id: string }>;
};

type LoyaltyWithTiers = LoyaltyProgram & {
  Review: { status: string } | null;
  LoyaltyTiers: Array<{
    minCustomerType: string;
    isActive: boolean;
    deletedAt: Date | null;
    Review: { status: string } | null;
  }>;
  MerchantLoyaltyRewards: Array<{
    isActive: boolean;
    Review: { status: string } | null;
  }>;
};

const toNumber = (value: unknown): number => Number(value);

const hasActivePaybill = (outlet: OutletBase): boolean =>
  outlet.PaybillOrTills.some(
    (paybill) => paybill.isActive && !paybill.deletedAt && hasApprovedReview(paybill.Review),
  );

const isOutletBaselineActive = (outlet: OutletBase): boolean =>
  // Outlet-level guardrails: if these fail, we skip all offer-type checks for this outlet.
  outlet.isActive &&
  outlet.Merchant.status === "Active" &&
  hasApprovedReview(outlet.Review) &&
  hasActivePaybill(outlet);

const selectMaxEligibleCashbackPercentage = (
  cashback: CashbackWithTiers,
  userType: string | undefined,
  now: Date,
): number | null => {
  if (
    !cashback.isActive ||
    cashback.deletedAt ||
    !hasApprovedReview(cashback.Review) ||
    !isBudgetAvailable(cashback.usedCashbackBudget, cashback.netCashbackBudget) ||
    !isWithinDateWindow(now, cashback.startDate, cashback.endDate) ||
    !isEligibleByCustomerType(cashback.eligibleCustomerTypes, userType)
  ) {
    return null;
  }

  const tierPercentages = cashback.CashbackConfigurationTiers
    .filter(
      (tier) => tier.isActive && !tier.deletedAt && hasApprovedReview(tier.Review),
    )
    .map((tier) => toNumber(tier.percentage));

  if (tierPercentages.length === 0) {
    return null;
  }

  return Math.max(...tierPercentages);
};

const isExclusiveEligible = (
  offer: ExclusiveWithOutlet,
  userType: string | undefined,
  now: Date,
): boolean => {
  if (
    !offer.isActive ||
    offer.deletedAt ||
    !hasApprovedReview(offer.Review) ||
    !isBudgetAvailable(offer.usedOfferBudget, offer.netOfferBudget) ||
    !isWithinDateWindow(now, offer.startDate, offer.endDate)
  ) {
    return false;
  }

  return isEligibleByCustomerType(offer.eligibleCustomerTypes, userType);
};

const isLoyaltyEligible = (program: LoyaltyWithTiers, userType: string | undefined): boolean => {
  if (
    !program.isActive ||
    !hasApprovedReview(program.Review) ||
    !isBudgetAvailable(program.pointsUsedInPeriod, program.pointsIssuedLimit)
  ) {
    return false;
  }

  const hasActiveReward = program.MerchantLoyaltyRewards.some(
    (reward) => reward.isActive && hasApprovedReview(reward.Review),
  );

  if (!hasActiveReward) {
    return false;
  }

  return program.LoyaltyTiers.some(
    (tier) =>
      tier.isActive &&
      !tier.deletedAt &&
      hasApprovedReview(tier.Review) &&
      isLoyaltyTierEligible(userType, tier.minCustomerType),
  );
};

export const rebuildOfferSnapshotsForUser = async (
  prisma: PrismaClient,
  options: ProjectionOptions,
): Promise<void> => {
  const now = options.now ?? new Date();
  // Thought process note: I tested splitting this into per-offer SQL queries first.
  // It was faster for tiny datasets, but harder to keep business rules aligned across offer types.
  // The current approach keeps rule logic centralized and predictable.

  const [customerTypes, outlets, cashbackConfigurations, exclusiveOffers, loyaltyPrograms] =
    await Promise.all([
      // Pull all required datasets up front; projection logic then runs in memory with no N+1 queries.
      prisma.customerType.findMany({
        where: {
          userId: options.userId,
          ...(options.merchantIds?.length
            ? {
                merchantId: {
                  in: options.merchantIds,
                },
              }
            : {}),
        },
      }),
      prisma.outlet.findMany({
        where: {
          ...(options.merchantIds?.length
            ? {
                merchantId: {
                  in: options.merchantIds,
                },
              }
            : {}),
        },
        include: {
          Merchant: {
            select: {
              id: true,
              status: true,
            },
          },
          Review: true,
          PaybillOrTills: {
            include: {
              Review: true,
            },
          },
        },
      }),
      prisma.cashbackConfiguration.findMany({
        where: {
          ...(options.merchantIds?.length
            ? {
                merchantId: {
                  in: options.merchantIds,
                },
              }
            : {}),
        },
        include: {
          Review: true,
          Outlets: { select: { id: true } },
          CashbackConfigurationTiers: {
            include: {
              Review: true,
            },
          },
        },
      }),
      prisma.exclusiveOffer.findMany({
        where: {
          ...(options.merchantIds?.length
            ? {
                merchantId: {
                  in: options.merchantIds,
                },
              }
            : {}),
        },
        include: {
          Review: true,
          Outlets: {
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.loyaltyProgram.findMany({
        where: {
          ...(options.merchantIds?.length
            ? {
                merchantId: {
                  in: options.merchantIds,
                },
              }
            : {}),
        },
        include: {
          Review: true,
          LoyaltyTiers: {
            include: {
              Review: true,
            },
          },
          MerchantLoyaltyRewards: {
            include: {
              Review: true,
            },
          },
        },
      }),
    ]);

  const typeByMerchant = new Map<string, string>(
    customerTypes.map((record: CustomerType) => [record.merchantId, record.type]),
  );

  const cashbackByOutlet = new Map<string, CashbackWithTiers[]>();
  for (const cashback of cashbackConfigurations as CashbackWithTiers[]) {
    for (const outlet of cashback.Outlets) {
      const existing = cashbackByOutlet.get(outlet.id);
      if (existing) {
        existing.push(cashback);
      } else {
        cashbackByOutlet.set(outlet.id, [cashback]);
      }
    }
  }

  const exclusiveByOutlet = new Map<string, ExclusiveWithOutlet[]>();
  for (const offer of exclusiveOffers as ExclusiveWithOutlet[]) {
    for (const outlet of offer.Outlets) {
      const existing = exclusiveByOutlet.get(outlet.id);
      if (existing) {
        existing.push(offer);
      } else {
        exclusiveByOutlet.set(outlet.id, [offer]);
      }
    }
  }

  const loyaltyByMerchant = new Map<string, LoyaltyWithTiers>();
  for (const loyalty of loyaltyPrograms as LoyaltyWithTiers[]) {
    if (loyalty.merchantId) {
      loyaltyByMerchant.set(loyalty.merchantId, loyalty);
    }
  }

  await prisma.$transaction(
    outlets.map((outlet) => {
      const typedOutlet = outlet as OutletBase;
      const userType = typeByMerchant.get(outlet.merchantId);
      const baselineActive = isOutletBaselineActive(typedOutlet);

      let hasCashback = false;
      let hasExclusiveOffer = false;
      let hasLoyaltyProgram = false;
      let maxCashbackPercentage: number | null = null;

      if (baselineActive) {
        // One outlet can map to multiple cashback configs; we keep the highest visible percentage.
        const cashback = cashbackByOutlet.get(outlet.id) ?? [];
        for (const item of cashback) {
          const candidateMax = selectMaxEligibleCashbackPercentage(item, userType, now);
          if (candidateMax !== null) {
            hasCashback = true;
            maxCashbackPercentage =
              maxCashbackPercentage === null
                ? candidateMax
                : Math.max(maxCashbackPercentage, candidateMax);
          }
        }

        const exclusives = exclusiveByOutlet.get(outlet.id) ?? [];
        hasExclusiveOffer = exclusives.some((offer) => isExclusiveEligible(offer, userType, now));

        // Loyalty lives at merchant level, so this is a single merchant-keyed lookup.
        const loyalty = loyaltyByMerchant.get(outlet.merchantId);
        hasLoyaltyProgram = loyalty ? isLoyaltyEligible(loyalty, userType) : false;
      }

      const activeOfferTypes = [
        hasCashback ? "Cashback" : null,
        hasExclusiveOffer ? "ExclusiveOffer" : null,
        hasLoyaltyProgram ? "LoyaltyProgram" : null,
      ].filter((value): value is string => value !== null);

      return prisma.offerEligibilitySnapshot.upsert({
        where: {
          userId_outletId: {
            userId: options.userId,
            outletId: outlet.id,
          },
        },
        create: {
          userId: options.userId,
          outletId: outlet.id,
          merchantId: outlet.merchantId,
          hasCashback,
          hasExclusiveOffer,
          hasLoyaltyProgram,
          maxCashbackPercentage,
          activeOfferTypes,
          lastComputedAt: now,
        },
        update: {
          merchantId: outlet.merchantId,
          hasCashback,
          hasExclusiveOffer,
          hasLoyaltyProgram,
          maxCashbackPercentage,
          activeOfferTypes,
          lastComputedAt: now,
        },
      });
    }),
  );

  // Useful local sanity check while tuning projection correctness:
  // const sample = await prisma.offerEligibilitySnapshot.findMany({ where: { userId: options.userId }, take: 5 });
  // console.debug("projected snapshots", sample);
};
