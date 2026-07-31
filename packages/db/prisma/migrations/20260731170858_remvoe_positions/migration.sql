/*
  Warnings:

  - You are about to drop the `Position` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Position" DROP CONSTRAINT "Position_userId_fkey";

-- DropIndex
DROP INDEX "Candle_timestamp_idx";

-- DropTable
DROP TABLE "Position";
