-- AlterTable
ALTER TABLE "ModifierOption" ADD COLUMN     "sourceVariantId" INTEGER;

-- AddForeignKey
ALTER TABLE "ModifierOption" ADD CONSTRAINT "ModifierOption_sourceVariantId_fkey" FOREIGN KEY ("sourceVariantId") REFERENCES "Variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
