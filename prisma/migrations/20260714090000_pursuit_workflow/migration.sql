-- AlterTable
ALTER TABLE "ContactInteraction" ADD COLUMN "pursuitId" TEXT;
ALTER TABLE "ContactInteraction" ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'LinkedIn';
ALTER TABLE "ContactInteraction" ADD COLUMN "messageText" TEXT;
ALTER TABLE "ContactInteraction" ADD COLUMN "aiNotes" TEXT;

-- CreateTable
CREATE TABLE "Pursuit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'Found',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "source" TEXT NOT NULL DEFAULT 'LinkedIn',
    "whyRelevant" TEXT,
    "storeLabAngle" TEXT,
    "currentStatus" TEXT,
    "nextAction" TEXT,
    "nextActionDueAt" DATETIME,
    "teaserVideoSent" BOOLEAN NOT NULL DEFAULT false,
    "lastInteractionAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pursuit_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pursuit_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Pursuit_businessId_idx" ON "Pursuit"("businessId");

-- CreateIndex
CREATE INDEX "Pursuit_personId_idx" ON "Pursuit"("personId");

-- CreateIndex
CREATE INDEX "Pursuit_stage_idx" ON "Pursuit"("stage");
