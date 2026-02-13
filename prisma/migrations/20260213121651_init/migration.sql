-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('Approved', 'Pending', 'Rejected');

-- CreateEnum
CREATE TYPE "MerchantStatus" AS ENUM ('Active', 'Pending', 'Disabled');

-- CreateTable
CREATE TABLE "Outlet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "merchantId" TEXT NOT NULL,
    "reviewId" TEXT,

    CONSTRAINT "Outlet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "description" TEXT,
    "status" "MerchantStatus" NOT NULL DEFAULT 'Active',
    "category" TEXT NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashbackConfiguration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "eligibleCustomerTypes" TEXT[],
    "merchantId" TEXT NOT NULL,
    "reviewId" TEXT,
    "netCashbackBudget" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "usedCashbackBudget" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "CashbackConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashbackConfigurationTier" (
    "id" TEXT NOT NULL,
    "cashbackConfigurationId" TEXT NOT NULL,
    "percentage" DECIMAL(65,30) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "reviewId" TEXT,

    CONSTRAINT "CashbackConfigurationTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExclusiveOffer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "eligibleCustomerTypes" TEXT[],
    "merchantId" TEXT,
    "reviewId" TEXT,
    "netOfferBudget" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "usedOfferBudget" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "ExclusiveOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "merchantId" TEXT,
    "reviewId" TEXT,
    "pointsUsedInPeriod" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "pointsIssuedLimit" DECIMAL(65,30),

    CONSTRAINT "LoyaltyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minCustomerType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "loyaltyProgramId" TEXT NOT NULL,
    "reviewId" TEXT,

    CONSTRAINT "LoyaltyTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantLoyaltyReward" (
    "id" TEXT NOT NULL,
    "loyaltyProgramId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reviewId" TEXT,

    CONSTRAINT "MerchantLoyaltyReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerType" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "CustomerType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaybillOrTill" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "reviewId" TEXT,

    CONSTRAINT "PaybillOrTill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferEligibilitySnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "hasCashback" BOOLEAN NOT NULL DEFAULT false,
    "hasExclusiveOffer" BOOLEAN NOT NULL DEFAULT false,
    "hasLoyaltyProgram" BOOLEAN NOT NULL DEFAULT false,
    "maxCashbackPercentage" DECIMAL(65,30),
    "activeOfferTypes" TEXT[],
    "lastComputedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferEligibilitySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CashbackConfigurationToOutlet" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CashbackConfigurationToOutlet_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ExclusiveOfferToOutlet" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ExclusiveOfferToOutlet_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Outlet_reviewId_key" ON "Outlet"("reviewId");

-- CreateIndex
CREATE INDEX "Outlet_merchantId_idx" ON "Outlet"("merchantId");

-- CreateIndex
CREATE INDEX "Outlet_isActive_idx" ON "Outlet"("isActive");

-- CreateIndex
CREATE INDEX "Merchant_status_category_idx" ON "Merchant"("status", "category");

-- CreateIndex
CREATE UNIQUE INDEX "CashbackConfiguration_reviewId_key" ON "CashbackConfiguration"("reviewId");

-- CreateIndex
CREATE INDEX "CashbackConfiguration_merchantId_isActive_deletedAt_idx" ON "CashbackConfiguration"("merchantId", "isActive", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CashbackConfigurationTier_reviewId_key" ON "CashbackConfigurationTier"("reviewId");

-- CreateIndex
CREATE INDEX "CashbackConfigurationTier_cashbackConfigurationId_isActive__idx" ON "CashbackConfigurationTier"("cashbackConfigurationId", "isActive", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExclusiveOffer_reviewId_key" ON "ExclusiveOffer"("reviewId");

-- CreateIndex
CREATE INDEX "ExclusiveOffer_merchantId_isActive_deletedAt_idx" ON "ExclusiveOffer"("merchantId", "isActive", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyProgram_merchantId_key" ON "LoyaltyProgram"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyProgram_reviewId_key" ON "LoyaltyProgram"("reviewId");

-- CreateIndex
CREATE INDEX "LoyaltyProgram_merchantId_isActive_idx" ON "LoyaltyProgram"("merchantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyTier_reviewId_key" ON "LoyaltyTier"("reviewId");

-- CreateIndex
CREATE INDEX "LoyaltyTier_loyaltyProgramId_isActive_deletedAt_idx" ON "LoyaltyTier"("loyaltyProgramId", "isActive", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantLoyaltyReward_reviewId_key" ON "MerchantLoyaltyReward"("reviewId");

-- CreateIndex
CREATE INDEX "MerchantLoyaltyReward_loyaltyProgramId_isActive_idx" ON "MerchantLoyaltyReward"("loyaltyProgramId", "isActive");

-- CreateIndex
CREATE INDEX "CustomerType_userId_idx" ON "CustomerType"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerType_userId_merchantId_key" ON "CustomerType"("userId", "merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "PaybillOrTill_reviewId_key" ON "PaybillOrTill"("reviewId");

-- CreateIndex
CREATE INDEX "PaybillOrTill_outletId_isActive_deletedAt_idx" ON "PaybillOrTill"("outletId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "OfferEligibilitySnapshot_userId_updatedAt_idx" ON "OfferEligibilitySnapshot"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "OfferEligibilitySnapshot_userId_hasCashback_hasExclusiveOff_idx" ON "OfferEligibilitySnapshot"("userId", "hasCashback", "hasExclusiveOffer", "hasLoyaltyProgram");

-- CreateIndex
CREATE INDEX "OfferEligibilitySnapshot_merchantId_idx" ON "OfferEligibilitySnapshot"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "OfferEligibilitySnapshot_userId_outletId_key" ON "OfferEligibilitySnapshot"("userId", "outletId");

-- CreateIndex
CREATE INDEX "_CashbackConfigurationToOutlet_B_index" ON "_CashbackConfigurationToOutlet"("B");

-- CreateIndex
CREATE INDEX "_ExclusiveOfferToOutlet_B_index" ON "_ExclusiveOfferToOutlet"("B");

-- AddForeignKey
ALTER TABLE "Outlet" ADD CONSTRAINT "Outlet_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outlet" ADD CONSTRAINT "Outlet_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashbackConfiguration" ADD CONSTRAINT "CashbackConfiguration_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashbackConfiguration" ADD CONSTRAINT "CashbackConfiguration_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashbackConfigurationTier" ADD CONSTRAINT "CashbackConfigurationTier_cashbackConfigurationId_fkey" FOREIGN KEY ("cashbackConfigurationId") REFERENCES "CashbackConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashbackConfigurationTier" ADD CONSTRAINT "CashbackConfigurationTier_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExclusiveOffer" ADD CONSTRAINT "ExclusiveOffer_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExclusiveOffer" ADD CONSTRAINT "ExclusiveOffer_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyProgram" ADD CONSTRAINT "LoyaltyProgram_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyProgram" ADD CONSTRAINT "LoyaltyProgram_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTier" ADD CONSTRAINT "LoyaltyTier_loyaltyProgramId_fkey" FOREIGN KEY ("loyaltyProgramId") REFERENCES "LoyaltyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTier" ADD CONSTRAINT "LoyaltyTier_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantLoyaltyReward" ADD CONSTRAINT "MerchantLoyaltyReward_loyaltyProgramId_fkey" FOREIGN KEY ("loyaltyProgramId") REFERENCES "LoyaltyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantLoyaltyReward" ADD CONSTRAINT "MerchantLoyaltyReward_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerType" ADD CONSTRAINT "CustomerType_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaybillOrTill" ADD CONSTRAINT "PaybillOrTill_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaybillOrTill" ADD CONSTRAINT "PaybillOrTill_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferEligibilitySnapshot" ADD CONSTRAINT "OfferEligibilitySnapshot_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferEligibilitySnapshot" ADD CONSTRAINT "OfferEligibilitySnapshot_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CashbackConfigurationToOutlet" ADD CONSTRAINT "_CashbackConfigurationToOutlet_A_fkey" FOREIGN KEY ("A") REFERENCES "CashbackConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CashbackConfigurationToOutlet" ADD CONSTRAINT "_CashbackConfigurationToOutlet_B_fkey" FOREIGN KEY ("B") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExclusiveOfferToOutlet" ADD CONSTRAINT "_ExclusiveOfferToOutlet_A_fkey" FOREIGN KEY ("A") REFERENCES "ExclusiveOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExclusiveOfferToOutlet" ADD CONSTRAINT "_ExclusiveOfferToOutlet_B_fkey" FOREIGN KEY ("B") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
