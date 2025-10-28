/*
  Warnings:

  - The `status` column on the `market_results` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `verification_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "market_results" ADD COLUMN     "color" TEXT,
ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "markets" ALTER COLUMN "resultTime" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."verification_tokens";

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_sections" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "customTitle" TEXT,
    "customDescription" TEXT,
    "localSettings" JSONB,

    CONSTRAINT "page_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "pages_slug_key" ON "pages"("slug");

-- CreateIndex
CREATE INDEX "page_sections_pageId_sortOrder_idx" ON "page_sections"("pageId", "sortOrder");

-- CreateIndex
CREATE INDEX "page_sections_sectionId_idx" ON "page_sections"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "page_sections_pageId_sectionId_key" ON "page_sections"("pageId", "sectionId");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_marketId_idx" ON "activity_logs"("marketId");

-- CreateIndex
CREATE INDEX "activity_logs_resultId_idx" ON "activity_logs"("resultId");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "content_blocks_sectionId_sortOrder_idx" ON "content_blocks"("sectionId", "sortOrder");

-- CreateIndex
CREATE INDEX "content_blocks_sectionId_isActive_idx" ON "content_blocks"("sectionId", "isActive");

-- CreateIndex
CREATE INDEX "content_blocks_createdAt_idx" ON "content_blocks"("createdAt");

-- CreateIndex
CREATE INDEX "market_results_marketId_idx" ON "market_results"("marketId");

-- CreateIndex
CREATE INDEX "market_results_date_createdAt_idx" ON "market_results"("date", "createdAt");

-- CreateIndex
CREATE INDEX "markets_isActive_idx" ON "markets"("isActive");

-- CreateIndex
CREATE INDEX "markets_sortOrder_idx" ON "markets"("sortOrder");

-- CreateIndex
CREATE INDEX "markets_status_idx" ON "markets"("status");

-- AddForeignKey
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
