-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "expireExempt" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DailyClose" (
    "id" SERIAL NOT NULL,
    "businessDate" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalRevenue" INTEGER NOT NULL,
    "orderCount" INTEGER NOT NULL,
    "dineInRevenue" INTEGER NOT NULL,
    "dineInCount" INTEGER NOT NULL,
    "takeoutRevenue" INTEGER NOT NULL,
    "takeoutCount" INTEGER NOT NULL,
    "cancelledCount" INTEGER NOT NULL,

    CONSTRAINT "DailyClose_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyClose_businessDate_key" ON "DailyClose"("businessDate");
