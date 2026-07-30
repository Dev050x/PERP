/*
  Warnings:

  - The primary key for the `Candle` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Candle` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Candle` table. All the data in the column will be lost.
  - Added the required column `volume` to the `Candle` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `timestamp` on the `Candle` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Candle" DROP CONSTRAINT "Candle_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
ADD COLUMN     "volume" TEXT NOT NULL,
DROP COLUMN "timestamp",
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "Candle_pkey" PRIMARY KEY ("market", "timestamp");

CREATE EXTENSION IF NOT EXISTS timescaledb;

SELECT create_hypertable('"Candle"', 'timestamp');