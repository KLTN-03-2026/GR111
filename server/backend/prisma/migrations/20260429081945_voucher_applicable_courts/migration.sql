-- CreateTable
CREATE TABLE "voucher_courts" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,

    CONSTRAINT "voucher_courts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "voucher_courts_voucherId_courtId_key" ON "voucher_courts"("voucherId", "courtId");

-- AddForeignKey
ALTER TABLE "voucher_courts" ADD CONSTRAINT "voucher_courts_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_courts" ADD CONSTRAINT "voucher_courts_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "courts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
