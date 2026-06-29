-- CreateTable
CREATE TABLE "Candle" (
    "id" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "open" TEXT NOT NULL,
    "high" TEXT NOT NULL,
    "low" TEXT NOT NULL,
    "close" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candle_pkey" PRIMARY KEY ("id")
);
