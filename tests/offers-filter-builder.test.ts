import { describe, expect, test } from "bun:test";
import { buildOfferSnapshotFilters } from "../apps/api/graphql/resolvers/user/helpers/offers/filters";

describe("buildOfferSnapshotFilters", () => {
  test("always scopes to user and requires at least one active offer type", () => {
    const where = buildOfferSnapshotFilters("user_alice", {});

    expect(where.userId).toBe("user_alice");
    expect(where.OR).toBeArray();
    expect(where.OR).toHaveLength(3);
  });

  test("adds category and search clauses when provided", () => {
    const where = buildOfferSnapshotFilters("user_bob", {
      category: "Food",
      search: "Urban",
    });

    const outlet = where.Outlet as Record<string, unknown>;
    const merchant = outlet.Merchant as Record<string, unknown>;

    expect(merchant.category).toBe("Food");
    expect(outlet.OR).toBeArray();
  });

  test("applies cashback percentage band constraints", () => {
    const under5 = buildOfferSnapshotFilters("user_1", { percentage: "UNDER_5" });
    const band5to10 = buildOfferSnapshotFilters("user_1", { percentage: "FROM_5_TO_10" });
    const above10 = buildOfferSnapshotFilters("user_1", { percentage: "ABOVE_10" });

    expect(under5.maxCashbackPercentage).toEqual({ lt: 5 });
    expect(band5to10.maxCashbackPercentage).toEqual({ gte: 5, lte: 10 });
    expect(above10.maxCashbackPercentage).toEqual({ gt: 10 });
  });
});
