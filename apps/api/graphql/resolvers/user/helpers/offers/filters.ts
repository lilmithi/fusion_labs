import type { Prisma } from "@prisma/client";
import type { OffersQueryInput } from "./types";

const SEARCH_FIELDS = ["name", "description", "Merchant.businessName", "Merchant.description"];

const escapeLike = (value: string) => value.replaceAll("%", "\\%").replaceAll("_", "\\_").trim();
// Earlier idea (kept here for reference): tokenize search and AND each token for stricter matching.
// const tokens = search?.split(/\s+/).filter(Boolean) ?? [];
// const tokenClauses = tokens.map((token) => ({ name: { contains: token, mode: "insensitive" } }));

export const buildOfferSnapshotFilters = (
  userId: string,
  input: OffersQueryInput,
): Prisma.OfferEligibilitySnapshotWhereInput => {
  const search = input.search?.trim();

  return {
    userId,
    // Snapshot rows are created per outlet; this gate ensures the outlet has at least one visible offer type.
    OR: [
      { hasCashback: true },
      { hasExclusiveOffer: true },
      { hasLoyaltyProgram: true },
    ],
    ...(input.percentage
      ? {
          hasCashback: true,
          ...(input.percentage === "UNDER_5" && { maxCashbackPercentage: { lt: 5 } }),
          ...(input.percentage === "FROM_5_TO_10" && { maxCashbackPercentage: { gte: 5, lte: 10 } }),
          ...(input.percentage === "ABOVE_10" && { maxCashbackPercentage: { gt: 10 } }),
        }
      : {}),
    Outlet: {
      isActive: true,
      Review: { status: "Approved" },
      PaybillOrTills: {
        some: {
          isActive: true,
          deletedAt: null,
          Review: { status: "Approved" },
        },
      },
      Merchant: {
        status: "Active",
        ...(input.category ? { category: input.category } : {}),
      },
      ...(search
        ? {
            OR: [
              { name: { contains: escapeLike(search), mode: "insensitive" } },
              { description: { contains: escapeLike(search), mode: "insensitive" } },
              { Merchant: { businessName: { contains: escapeLike(search), mode: "insensitive" } } },
              { Merchant: { description: { contains: escapeLike(search), mode: "insensitive" } } },
            ],
          }
        : {}),
    },
  };
};

export const SNAPSHOT_SEARCH_FIELDS = SEARCH_FIELDS;
