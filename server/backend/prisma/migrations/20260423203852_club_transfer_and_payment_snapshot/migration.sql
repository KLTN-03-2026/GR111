-- AlterTable
ALTER TABLE "clubs" ADD COLUMN     "transferAccountNumber" TEXT,
ADD COLUMN     "transferBankName" TEXT,
ADD COLUMN     "transferBeneficiaryName" TEXT,
ADD COLUMN     "transferQrImageUrl" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "beneficiaryName" TEXT,
ADD COLUMN     "qrImageUrl" TEXT;
