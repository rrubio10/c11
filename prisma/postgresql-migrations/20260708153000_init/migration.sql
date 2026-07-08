CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'ABANDONED');
CREATE TYPE "CorrectionStatus" AS ENUM ('UNGRADED', 'CORRECT', 'INCORRECT', 'PARTIAL', 'MANUAL_REVIEW');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

CREATE TABLE "ExerciseSet" (
  "id" TEXT PRIMARY KEY,
  "externalId" TEXT NOT NULL UNIQUE,
  "section" TEXT NOT NULL,
  "part" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "instructions" TEXT NOT NULL DEFAULT '',
  "fullText" TEXT NOT NULL,
  "sourcePages" TEXT NOT NULL DEFAULT '',
  "transcriptionStatus" TEXT NOT NULL DEFAULT 'verified',
  "notes" TEXT NOT NULL DEFAULT '',
  "itemCount" INTEGER NOT NULL,
  "testGroup" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "contentVersion" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "ExerciseSet_section_part_idx" ON "ExerciseSet"("section", "part");
CREATE INDEX "ExerciseSet_testGroup_idx" ON "ExerciseSet"("testGroup");

CREATE TABLE "ExerciseItem" (
  "id" TEXT PRIMARY KEY,
  "externalId" TEXT NOT NULL UNIQUE,
  "exerciseSetId" TEXT NOT NULL REFERENCES "ExerciseSet"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "number" INTEGER NOT NULL,
  "prompt" TEXT NOT NULL DEFAULT '',
  "optionsJson" TEXT NOT NULL DEFAULT '[]',
  "keyword" TEXT,
  "baseWord" TEXT,
  "correctAnswer" TEXT NOT NULL,
  "acceptedJson" TEXT NOT NULL,
  "maximumPoints" INTEGER NOT NULL,
  "errorCategory" TEXT NOT NULL DEFAULT '',
  "explanation" TEXT NOT NULL DEFAULT '',
  "displayOrder" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExerciseItem_exerciseSetId_number_key" UNIQUE ("exerciseSetId", "number")
);
CREATE INDEX "ExerciseItem_exerciseSetId_displayOrder_idx" ON "ExerciseItem"("exerciseSetId", "displayOrder");

CREATE TABLE "AnswerVariant" (
  "id" TEXT PRIMARY KEY,
  "exerciseItemId" TEXT NOT NULL REFERENCES "ExerciseItem"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "answer" TEXT NOT NULL,
  "normalized" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'IMPORT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnswerVariant_exerciseItemId_normalized_points_key" UNIQUE ("exerciseItemId", "normalized", "points")
);

CREATE TABLE "Attempt" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "exerciseSetId" TEXT REFERENCES "ExerciseSet"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "testGroup" TEXT,
  "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" TIMESTAMP(3),
  "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
  "rawScore" INTEGER NOT NULL DEFAULT 0,
  "maximumScore" INTEGER NOT NULL DEFAULT 0,
  "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "correctionVersion" INTEGER NOT NULL DEFAULT 1,
  "currentItemExternalId" TEXT,
  "timerMode" TEXT NOT NULL DEFAULT 'ELAPSED'
);
CREATE INDEX "Attempt_userId_status_idx" ON "Attempt"("userId", "status");
CREATE INDEX "Attempt_exerciseSetId_idx" ON "Attempt"("exerciseSetId");
CREATE INDEX "Attempt_testGroup_idx" ON "Attempt"("testGroup");

CREATE TABLE "UserAnswer" (
  "id" TEXT PRIMARY KEY,
  "attemptId" TEXT NOT NULL REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "exerciseItemId" TEXT NOT NULL REFERENCES "ExerciseItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "answer" TEXT NOT NULL DEFAULT '',
  "normalizedAnswer" TEXT NOT NULL DEFAULT '',
  "awardedPoints" INTEGER NOT NULL DEFAULT 0,
  "isCorrect" BOOLEAN NOT NULL DEFAULT FALSE,
  "correctionStatus" "CorrectionStatus" NOT NULL DEFAULT 'UNGRADED',
  "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserAnswer_attemptId_exerciseItemId_key" UNIQUE ("attemptId", "exerciseItemId")
);
CREATE INDEX "UserAnswer_attemptId_idx" ON "UserAnswer"("attemptId");

CREATE TABLE "ImportRun" (
  "id" TEXT PRIMARY KEY,
  "sourceName" TEXT NOT NULL,
  "sourceHash" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "setCount" INTEGER NOT NULL DEFAULT 0,
  "itemCount" INTEGER NOT NULL DEFAULT 0,
  "errorsJson" TEXT NOT NULL DEFAULT '[]',
  "warningsJson" TEXT NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
