-- AlterTable
ALTER TABLE "owner_profiles" ADD COLUMN "billingIntroDismissedAt" TIMESTAMP(3);
ALTER TABLE "owner_profiles" ADD COLUMN "subscriptionPlanKey" TEXT;
ALTER TABLE "owner_profiles" ADD COLUMN "subscriptionAddons" JSONB DEFAULT '[]'::jsonb;
