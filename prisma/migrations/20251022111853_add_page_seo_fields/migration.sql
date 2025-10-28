-- AlterTable
ALTER TABLE "pages" ADD COLUMN     "canonicalUrl" TEXT,
ADD COLUMN     "h1" TEXT,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "ogImageUrl" TEXT,
ADD COLUMN     "robotsNoFollow" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "robotsNoIndex" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seoSchema" JSONB,
ADD COLUMN     "twitterCard" TEXT;
