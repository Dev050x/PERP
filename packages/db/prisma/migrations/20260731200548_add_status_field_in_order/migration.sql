-- CreateEnum
CREATE TYPE "orderStatus" AS ENUM ('open', 'partiallyFilled', 'Filled', 'Close', 'Cancel');

-- AlterTable
ALTER TABLE "Orders" ADD COLUMN     "status" "orderStatus" NOT NULL DEFAULT 'open';
