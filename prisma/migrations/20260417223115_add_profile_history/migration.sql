-- CreateTable
CREATE TABLE "profile_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profile_history_userId_idx" ON "profile_history"("userId");

-- CreateIndex
CREATE INDEX "profile_history_changedAt_idx" ON "profile_history"("changedAt");

-- AddForeignKey
ALTER TABLE "profile_history" ADD CONSTRAINT "profile_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
