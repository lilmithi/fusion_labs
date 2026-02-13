import { describe, expect, test } from "bun:test";
import {
  isBudgetAvailable,
  isEligibleByCustomerType,
  isLoyaltyTierEligible,
  isWithinDateWindow,
  percentageMatchesFilter,
} from "../apps/api/graphql/resolvers/user/helpers/offers/eligibility";

describe("offers eligibility helpers", () => {
  test("customer type matching handles All and NonCustomer", () => {
    expect(isEligibleByCustomerType(["All"], undefined)).toBeTrue();
    expect(isEligibleByCustomerType(["NonCustomer"], undefined)).toBeTrue();
    expect(isEligibleByCustomerType(["Regular"], "Regular")).toBeTrue();
    expect(isEligibleByCustomerType(["Vip"], "Regular")).toBeFalse();
  });

  test("loyalty hierarchy grants lower tiers to higher-ranked users", () => {
    expect(isLoyaltyTierEligible("Regular", "New")).toBeTrue();
    expect(isLoyaltyTierEligible("Vip", "Regular")).toBeTrue();
    expect(isLoyaltyTierEligible("New", "Vip")).toBeFalse();
  });

  test("date window and budget checks behave as expected", () => {
    const now = new Date("2026-02-13T10:00:00.000Z");

    expect(isWithinDateWindow(now, null, null)).toBeTrue();
    expect(
      isWithinDateWindow(now, new Date("2026-02-10T00:00:00.000Z"), new Date("2026-02-20T00:00:00.000Z")),
    ).toBeTrue();
    expect(isWithinDateWindow(now, new Date("2026-02-10T00:00:00.000Z"), null)).toBeFalse();

    expect(isBudgetAvailable(90, 100)).toBeTrue();
    expect(isBudgetAvailable(100, 100)).toBeFalse();
    expect(isBudgetAvailable(100, null)).toBeTrue();
  });

  test("cashback percentage filters map to expected ranges", () => {
    expect(percentageMatchesFilter(4, "UNDER_5")).toBeTrue();
    expect(percentageMatchesFilter(7, "FROM_5_TO_10")).toBeTrue();
    expect(percentageMatchesFilter(11, "ABOVE_10")).toBeTrue();
    expect(percentageMatchesFilter(9, "ABOVE_10")).toBeFalse();
  });
});
