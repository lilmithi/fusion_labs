import { ReviewStatus, MerchantStatus } from "../generated/prisma/client";
import { rebuildOfferSnapshotsForUser } from "../apps/api/services/offers/offer-eligibility-projector";
import { prisma } from "../apps/api/lib/prisma";

const USERS = {
  alice: "user_alice",
  bob: "user_bob",
  chris: "user_chris",
} as const;

const MERCHANTS = {
  urbanBites: "merchant_urban_bites",
  fitFuel: "merchant_fit_fuel",
  gadgetHub: "merchant_gadget_hub",
  sleepyCafe: "merchant_sleepy_cafe",
} as const;

const OUTLETS = {
  urbanWestlands: "outlet_urban_westlands",
  urbanKaren: "outlet_urban_karen",
  fitFuelKilimani: "outlet_fit_fuel_kilimani",
  gadgetHubCBD: "outlet_gadget_hub_cbd",
  sleepyCafeNgong: "outlet_sleepy_cafe_ngong",
} as const;

const createApprovedReview = () =>
  prisma.review.create({ data: { status: ReviewStatus.Approved } });

const createOutletWithPaybill = async (args: {
  outletId: string;
  merchantId: string;
  name: string;
  description: string;
  isActive?: boolean;
}) => {
  const outletReview = await createApprovedReview();
  const outlet = await prisma.outlet.create({
    data: {
      id: args.outletId,
      merchantId: args.merchantId,
      name: args.name,
      description: args.description,
      isActive: args.isActive ?? true,
      reviewId: outletReview.id,
    },
  });

  const paybillReview = await createApprovedReview();
  await prisma.paybillOrTill.create({
    data: {
      outletId: outlet.id,
      isActive: true,
      reviewId: paybillReview.id,
    },
  });

  return outlet;
};

const resetDatabase = async () => {
  await prisma.offerEligibilitySnapshot.deleteMany();
  await prisma.customerType.deleteMany();
  await prisma.paybillOrTill.deleteMany();
  await prisma.cashbackConfigurationTier.deleteMany();
  await prisma.exclusiveOffer.deleteMany();
  await prisma.cashbackConfiguration.deleteMany();
  await prisma.loyaltyTier.deleteMany();
  await prisma.merchantLoyaltyReward.deleteMany();
  await prisma.loyaltyProgram.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.review.deleteMany();
};

const seedCoreCatalog = async () => {
  await prisma.merchant.createMany({
    data: [
      {
        id: MERCHANTS.urbanBites,
        businessName: "Urban Bites",
        description: "Modern casual dining with quick meal delivery.",
        category: "Food",
        status: MerchantStatus.Active,
      },
      {
        id: MERCHANTS.fitFuel,
        businessName: "FitFuel Grocery",
        description: "Healthy groceries and supplements.",
        category: "Groceries",
        status: MerchantStatus.Active,
      },
      {
        id: MERCHANTS.gadgetHub,
        businessName: "Gadget Hub",
        description: "Phones, laptops and accessories.",
        category: "Electronics",
        status: MerchantStatus.Active,
      },
      {
        id: MERCHANTS.sleepyCafe,
        businessName: "Sleepy Cafe",
        description: "Coffee spot currently under onboarding.",
        category: "Food",
        status: MerchantStatus.Pending,
      },
    ],
  });

  await createOutletWithPaybill({
    outletId: OUTLETS.urbanWestlands,
    merchantId: MERCHANTS.urbanBites,
    name: "Urban Bites - Westlands",
    description: "Main branch with full cashback coverage.",
  });

  await createOutletWithPaybill({
    outletId: OUTLETS.urbanKaren,
    merchantId: MERCHANTS.urbanBites,
    name: "Urban Bites - Karen",
    description: "Secondary branch with exclusive offers.",
  });

  await createOutletWithPaybill({
    outletId: OUTLETS.fitFuelKilimani,
    merchantId: MERCHANTS.fitFuel,
    name: "FitFuel - Kilimani",
    description: "Healthy groceries and rewards.",
  });

  await createOutletWithPaybill({
    outletId: OUTLETS.gadgetHubCBD,
    merchantId: MERCHANTS.gadgetHub,
    name: "Gadget Hub - CBD",
    description: "Electronics offers with stricter eligibility.",
  });

  await createOutletWithPaybill({
    outletId: OUTLETS.sleepyCafeNgong,
    merchantId: MERCHANTS.sleepyCafe,
    name: "Sleepy Cafe - Ngong Road",
    description: "Pending merchant to verify merchant-status filtering.",
  });
};

const seedCashbackConfigurations = async () => {
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);
  const lastWeek = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7);

  const cashbackReviewA = await createApprovedReview();
  const cashbackA = await prisma.cashbackConfiguration.create({
    data: {
      id: "cashback_urban_all",
      name: "Urban Bites Universal Cashback",
      merchantId: MERCHANTS.urbanBites,
      isActive: true,
      startDate: lastWeek,
      endDate: nextMonth,
      netCashbackBudget: 10_000,
      usedCashbackBudget: 1_250,
      eligibleCustomerTypes: ["All"],
      reviewId: cashbackReviewA.id,
      Outlets: {
        connect: [{ id: OUTLETS.urbanWestlands }, { id: OUTLETS.urbanKaren }],
      },
    },
  });

  const tierReviewA1 = await createApprovedReview();
  await prisma.cashbackConfigurationTier.create({
    data: {
      cashbackConfigurationId: cashbackA.id,
      percentage: 6,
      reviewId: tierReviewA1.id,
    },
  });

  const tierReviewA2 = await createApprovedReview();
  await prisma.cashbackConfigurationTier.create({
    data: {
      cashbackConfigurationId: cashbackA.id,
      percentage: 12,
      reviewId: tierReviewA2.id,
    },
  });

  const cashbackReviewB = await createApprovedReview();
  const cashbackB = await prisma.cashbackConfiguration.create({
    data: {
      id: "cashback_fitfuel_loyal",
      name: "FitFuel Loyal Customers",
      merchantId: MERCHANTS.fitFuel,
      isActive: true,
      startDate: lastWeek,
      endDate: nextMonth,
      netCashbackBudget: 2_000,
      usedCashbackBudget: 300,
      eligibleCustomerTypes: ["Regular", "Vip"],
      reviewId: cashbackReviewB.id,
      Outlets: {
        connect: [{ id: OUTLETS.fitFuelKilimani }],
      },
    },
  });

  const tierReviewB = await createApprovedReview();
  await prisma.cashbackConfigurationTier.create({
    data: {
      cashbackConfigurationId: cashbackB.id,
      percentage: 8,
      reviewId: tierReviewB.id,
    },
  });

  const cashbackReviewC = await createApprovedReview();
  await prisma.cashbackConfiguration.create({
    data: {
      id: "cashback_gadget_exhausted",
      name: "Gadget Hub Exhausted Budget",
      merchantId: MERCHANTS.gadgetHub,
      isActive: true,
      startDate: lastWeek,
      endDate: nextMonth,
      netCashbackBudget: 1_000,
      usedCashbackBudget: 1_000,
      eligibleCustomerTypes: ["All"],
      reviewId: cashbackReviewC.id,
      Outlets: {
        connect: [{ id: OUTLETS.gadgetHubCBD }],
      },
    },
  });
};

const seedExclusiveOffers = async () => {
  const now = new Date();
  const inTwoMonths = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 60);
  const tomorrow = new Date(now.getTime() + 1000 * 60 * 60 * 24);

  const reviewA = await createApprovedReview();
  await prisma.exclusiveOffer.create({
    data: {
      id: "exclusive_urban_newcomer",
      name: "Urban Welcome Week",
      description: "Extra meal vouchers for non-customers and new customers.",
      merchantId: MERCHANTS.urbanBites,
      startDate: now,
      endDate: inTwoMonths,
      netOfferBudget: 5_000,
      usedOfferBudget: 1_100,
      eligibleCustomerTypes: ["NonCustomer", "New"],
      reviewId: reviewA.id,
      Outlets: {
        connect: [{ id: OUTLETS.urbanKaren }],
      },
    },
  });

  const reviewB = await createApprovedReview();
  await prisma.exclusiveOffer.create({
    data: {
      id: "exclusive_fitfuel_flash",
      name: "FitFuel Flash Sale",
      description: "Short campaign for all customer segments.",
      merchantId: MERCHANTS.fitFuel,
      startDate: now,
      endDate: tomorrow,
      netOfferBudget: 3_000,
      usedOfferBudget: 450,
      eligibleCustomerTypes: ["All"],
      reviewId: reviewB.id,
      Outlets: {
        connect: [{ id: OUTLETS.fitFuelKilimani }],
      },
    },
  });
};

const seedLoyaltyPrograms = async () => {
  const loyaltyReviewUrban = await createApprovedReview();
  const urbanLoyalty = await prisma.loyaltyProgram.create({
    data: {
      id: "loyalty_urban",
      name: "Urban Stars",
      merchantId: MERCHANTS.urbanBites,
      isActive: true,
      pointsUsedInPeriod: 400,
      pointsIssuedLimit: 5_000,
      reviewId: loyaltyReviewUrban.id,
    },
  });

  const urbanRewardReview = await createApprovedReview();
  await prisma.merchantLoyaltyReward.create({
    data: {
      loyaltyProgramId: urbanLoyalty.id,
      name: "Free Dessert",
      isActive: true,
      reviewId: urbanRewardReview.id,
    },
  });

  const urbanTierReviewNew = await createApprovedReview();
  const urbanTierReviewRegular = await createApprovedReview();
  const urbanTierReviewVip = await createApprovedReview();
  await prisma.loyaltyTier.createMany({
    data: [
      {
        id: "tier_urban_new",
        loyaltyProgramId: urbanLoyalty.id,
        name: "Bronze",
        minCustomerType: "New",
        reviewId: urbanTierReviewNew.id,
      },
      {
        id: "tier_urban_regular",
        loyaltyProgramId: urbanLoyalty.id,
        name: "Silver",
        minCustomerType: "Regular",
        reviewId: urbanTierReviewRegular.id,
      },
      {
        id: "tier_urban_vip",
        loyaltyProgramId: urbanLoyalty.id,
        name: "Gold",
        minCustomerType: "Vip",
        reviewId: urbanTierReviewVip.id,
      },
    ],
  });

  const loyaltyReviewFitFuel = await createApprovedReview();
  const fitFuelLoyalty = await prisma.loyaltyProgram.create({
    data: {
      id: "loyalty_fitfuel",
      name: "FitFuel Points",
      merchantId: MERCHANTS.fitFuel,
      isActive: true,
      pointsUsedInPeriod: 50,
      pointsIssuedLimit: 2_500,
      reviewId: loyaltyReviewFitFuel.id,
    },
  });

  const fitFuelRewardReview = await createApprovedReview();
  await prisma.merchantLoyaltyReward.create({
    data: {
      loyaltyProgramId: fitFuelLoyalty.id,
      name: "Protein Bar Reward",
      isActive: true,
      reviewId: fitFuelRewardReview.id,
    },
  });

  const fitFuelTierReview = await createApprovedReview();
  await prisma.loyaltyTier.create({
    data: {
      id: "tier_fitfuel_new",
      loyaltyProgramId: fitFuelLoyalty.id,
      name: "Starter",
      minCustomerType: "New",
      reviewId: fitFuelTierReview.id,
    },
  });
};

const seedCustomerTypes = async () => {
  await prisma.customerType.createMany({
    data: [
      { userId: USERS.alice, merchantId: MERCHANTS.urbanBites, type: "Vip" },
      { userId: USERS.alice, merchantId: MERCHANTS.fitFuel, type: "Regular" },
      { userId: USERS.bob, merchantId: MERCHANTS.urbanBites, type: "New" },
      {
        userId: USERS.bob,
        merchantId: MERCHANTS.gadgetHub,
        type: "Infrequent",
      },
    ],
  });
};

const seed = async () => {
  console.log("Resetting existing data...");
  await resetDatabase();

  console.log("Seeding catalog and offers...");
  await seedCoreCatalog();
  await seedCashbackConfigurations();
  await seedExclusiveOffers();
  await seedLoyaltyPrograms();
  await seedCustomerTypes();

  console.log("Building offer eligibility snapshots for demo users...");
  await rebuildOfferSnapshotsForUser(prisma, { userId: USERS.alice });
  await rebuildOfferSnapshotsForUser(prisma, { userId: USERS.bob });
  await rebuildOfferSnapshotsForUser(prisma, { userId: USERS.chris });

  // Optional scenario toggles I used while testing edge behavior:
  // 1) Simulate merchant deactivation impact:
  // await prisma.merchant.update({ where: { id: MERCHANTS.urbanBites }, data: { status: MerchantStatus.Disabled } });
  // 2) Simulate expired exclusive offer:
  // await prisma.exclusiveOffer.update({ where: { id: "exclusive_fitfuel_flash" }, data: { endDate: new Date("2020-01-01") } });
  // 3) Simulate customer upgrading tier:
  // await prisma.customerType.update({ where: { userId_merchantId: { userId: USERS.bob, merchantId: MERCHANTS.urbanBites } }, data: { type: "Regular" } });

  console.log("Seeding complete.");
  console.log("Demo users: user_alice, user_bob, user_chris");
};

seed()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
