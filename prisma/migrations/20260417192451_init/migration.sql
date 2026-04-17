-- CreateEnum
CREATE TYPE "GenderIdentity" AS ENUM ('WOMAN_CIS', 'MAN_CIS', 'WOMAN_TRANS', 'MAN_TRANS', 'NON_BINARY', 'GENDER_FLUID', 'AGENDER', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "AgeRange" AS ENUM ('UNDER_18', 'AGE_18_25', 'AGE_26_35', 'AGE_36_45', 'AGE_46_55', 'AGE_56_65', 'OVER_65', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('NO_FORMAL', 'PRIMARY', 'SECONDARY', 'TECHNICAL', 'UNDERGRADUATE', 'POSTGRADUATE', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('EMPLOYED_FULL', 'EMPLOYED_PART', 'SELF_EMPLOYED', 'UNEMPLOYED', 'STUDENT', 'RETIRED', 'UNABLE_TO_WORK', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'IN_RELATIONSHIP', 'MARRIED', 'DIVORCED', 'WIDOWED', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "SentimentLevel" AS ENUM ('VERY_POSITIVE', 'POSITIVE', 'NEUTRAL', 'NEGATIVE', 'VERY_NEGATIVE');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EntryMode" AS ENUM ('VOICE', 'TEXT', 'BOTH');

-- CreateEnum
CREATE TYPE "CrisisContactType" AS ENUM ('SUICIDE_IDEATION', 'DOMESTIC_VIOLENCE', 'ANXIETY_CRISIS', 'SUBSTANCE_ABUSE', 'IDENTITY_CRISIS', 'GENERAL');

-- CreateEnum
CREATE TYPE "ContactChannel" AS ENUM ('PHONE', 'WHATSAPP', 'CHAT_ONLINE', 'EMAIL');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'RESEARCHER', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sociodemographic" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT,
    "userId" TEXT,
    "ageRange" "AgeRange",
    "genderIdentity" "GenderIdentity",
    "genderOther" TEXT,
    "country" TEXT,
    "region" TEXT,
    "educationLevel" "EducationLevel",
    "employmentStatus" "EmploymentStatus",
    "maritalStatus" "MaritalStatus",
    "hasPriorDiagnosis" BOOLEAN,
    "consentResearch" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sociodemographic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entries" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT,
    "userId" TEXT,
    "sociodemographicId" TEXT,
    "mode" "EntryMode" NOT NULL DEFAULT 'VOICE',
    "transcription" TEXT,
    "textContent" TEXT,
    "audioDeletedAt" TIMESTAMP(3),
    "sentiment" "SentimentLevel",
    "sentimentScore" DOUBLE PRECISION,
    "emotionCategories" TEXT[],
    "topics" TEXT[],
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'NONE',
    "riskKeywords" TEXT[],
    "aiSummary" TEXT,
    "wellbeingScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crisis_resources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "situationType" "CrisisContactType" NOT NULL,
    "channel" "ContactChannel" NOT NULL,
    "contactValue" TEXT NOT NULL,
    "schedule" TEXT,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "timesShown" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crisis_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "population_snapshots" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalEntries" INTEGER NOT NULL DEFAULT 0,
    "sentimentDistribution" JSONB NOT NULL,
    "riskDistribution" JSONB NOT NULL,
    "topTopics" JSONB NOT NULL,
    "byGender" JSONB NOT NULL,
    "byAgeRange" JSONB NOT NULL,
    "byCountry" JSONB NOT NULL,
    "byEmployment" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "population_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "sociodemographic_sessionToken_key" ON "sociodemographic"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "sociodemographic_userId_key" ON "sociodemographic"("userId");

-- CreateIndex
CREATE INDEX "entries_userId_idx" ON "entries"("userId");

-- CreateIndex
CREATE INDEX "entries_sessionToken_idx" ON "entries"("sessionToken");

-- CreateIndex
CREATE INDEX "entries_createdAt_idx" ON "entries"("createdAt");

-- CreateIndex
CREATE INDEX "entries_riskLevel_idx" ON "entries"("riskLevel");

-- CreateIndex
CREATE INDEX "crisis_resources_country_idx" ON "crisis_resources"("country");

-- CreateIndex
CREATE INDEX "crisis_resources_situationType_idx" ON "crisis_resources"("situationType");

-- CreateIndex
CREATE INDEX "crisis_resources_isActive_idx" ON "crisis_resources"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "population_snapshots_date_key" ON "population_snapshots"("date");

-- AddForeignKey
ALTER TABLE "sociodemographic" ADD CONSTRAINT "sociodemographic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_sociodemographicId_fkey" FOREIGN KEY ("sociodemographicId") REFERENCES "sociodemographic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
