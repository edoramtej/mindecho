-- CreateEnum
CREATE TYPE "EmergencyContactPref" AS ENUM ('CALL', 'WHATSAPP');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "emergencyContactPref" "EmergencyContactPref";
