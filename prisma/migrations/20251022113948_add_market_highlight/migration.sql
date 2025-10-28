-- AlterTable
ALTER TABLE "markets" ADD COLUMN     "highlightActionText" TEXT,
ADD COLUMN     "highlightActionUrl" TEXT,
ADD COLUMN     "highlightMessage" TEXT,
ADD COLUMN     "isHighlighted" BOOLEAN NOT NULL DEFAULT false;
