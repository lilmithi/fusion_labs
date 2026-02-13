import { ORDERED_CUSTOMER_TYPES, type CashbackPercentageFilters, type CustomerType } from "./types";

const APPROVED = "Approved";

type ReviewLike = { status: string } | null | undefined;

export const hasApprovedReview = (review: ReviewLike): boolean => review?.status === APPROVED;

export const isWithinDateWindow = (
  now: Date,
  startDate?: Date | null,
  endDate?: Date | null,
): boolean => {
  // Both dates omitted means the offer/config is treated as always active.
  if (!startDate && !endDate) {
    return true;
  }

  // One-sided windows are treated as invalid to avoid ambiguous publish behavior.
  if (!startDate || !endDate) {
    return false;
  }

  return startDate <= now && endDate >= now;
};

export const isBudgetAvailable = (
  used: unknown,
  limit?: unknown,
): boolean => {
  if (limit === null || limit === undefined) {
    return true;
  }

  return Number(used) < Number(limit);
};

export const isEligibleByCustomerType = (
  eligibleCustomerTypes: string[],
  userType: string | undefined,
): boolean => {
  if (eligibleCustomerTypes.includes("All")) {
    return true;
  }

  if (!userType) {
    return eligibleCustomerTypes.includes("NonCustomer");
  }

  return eligibleCustomerTypes.includes(userType);
};

export const isLoyaltyTierEligible = (
  userType: string | undefined,
  minCustomerType: string,
): boolean => {
  // No customer-type record means user is outside the merchant relationship ladder.
  const resolvedType = (userType ?? "NonCustomer") as CustomerType;
  const userRank = ORDERED_CUSTOMER_TYPES[resolvedType] ?? ORDERED_CUSTOMER_TYPES.NonCustomer;
  const tierRank = ORDERED_CUSTOMER_TYPES[minCustomerType as CustomerType] ?? Number.MAX_SAFE_INTEGER;

  return userRank >= tierRank;
};

export const percentageMatchesFilter = (
  percentage: number,
  filter: CashbackPercentageFilters | null | undefined,
): boolean => {
  if (!filter) {
    return true;
  }

  if (filter === "UNDER_5") {
    return percentage < 5;
  }

  if (filter === "FROM_5_TO_10") {
    return percentage >= 5 && percentage <= 10;
  }

  return percentage > 10;
};
