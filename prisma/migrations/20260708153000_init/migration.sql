PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'USER',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt");

CREATE TABLE IF NOT EXISTS "ExerciseSet" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "externalId" TEXT NOT NULL,
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
  "active" BOOLEAN NOT NULL DEFAULT true,
  "contentVersion" INTEGER NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "ExerciseSet_externalId_key" ON "ExerciseSet"("externalId");
CREATE INDEX IF NOT EXISTS "ExerciseSet_section_part_idx" ON "ExerciseSet"("section", "part");
CREATE INDEX IF NOT EXISTS "ExerciseSet_testGroup_idx" ON "ExerciseSet"("testGroup");

CREATE TABLE IF NOT EXISTS "ExerciseItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "externalId" TEXT NOT NULL,
  "exerciseSetId" TEXT NOT NULL,
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
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ExerciseItem_exerciseSetId_fkey" FOREIGN KEY ("exerciseSetId") REFERENCES "ExerciseSet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ExerciseItem_externalId_key" ON "ExerciseItem"("externalId");
CREATE UNIQUE INDEX IF NOT EXISTS "ExerciseItem_exerciseSetId_number_key" ON "ExerciseItem"("exerciseSetId", "number");
CREATE INDEX IF NOT EXISTS "ExerciseItem_exerciseSetId_displayOrder_idx" ON "ExerciseItem"("exerciseSetId", "displayOrder");

CREATE TABLE IF NOT EXISTS "AnswerVariant" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "exerciseItemId" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "normalized" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'IMPORT',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnswerVariant_exerciseItemId_fkey" FOREIGN KEY ("exerciseItemId") REFERENCES "ExerciseItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "AnswerVariant_exerciseItemId_normalized_points_key" ON "AnswerVariant"("exerciseItemId", "normalized", "points");

CREATE TABLE IF NOT EXISTS "Attempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "exerciseSetId" TEXT,
  "testGroup" TEXT,
  "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" DATETIME,
  "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
  "rawScore" INTEGER NOT NULL DEFAULT 0,
  "maximumScore" INTEGER NOT NULL DEFAULT 0,
  "percentage" REAL NOT NULL DEFAULT 0,
  "correctionVersion" INTEGER NOT NULL DEFAULT 1,
  "currentItemExternalId" TEXT,
  "timerMode" TEXT NOT NULL DEFAULT 'ELAPSED',
  CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Attempt_exerciseSetId_fkey" FOREIGN KEY ("exerciseSetId") REFERENCES "ExerciseSet" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Attempt_userId_status_idx" ON "Attempt"("userId", "status");
CREATE INDEX IF NOT EXISTS "Attempt_exerciseSetId_idx" ON "Attempt"("exerciseSetId");
CREATE INDEX IF NOT EXISTS "Attempt_testGroup_idx" ON "Attempt"("testGroup");

CREATE TABLE IF NOT EXISTS "UserAnswer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "attemptId" TEXT NOT NULL,
  "exerciseItemId" TEXT NOT NULL,
  "answer" TEXT NOT NULL DEFAULT '',
  "normalizedAnswer" TEXT NOT NULL DEFAULT '',
  "awardedPoints" INTEGER NOT NULL DEFAULT 0,
  "isCorrect" BOOLEAN NOT NULL DEFAULT false,
  "correctionStatus" TEXT NOT NULL DEFAULT 'UNGRADED',
  "answeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "UserAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserAnswer_exerciseItemId_fkey" FOREIGN KEY ("exerciseItemId") REFERENCES "ExerciseItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserAnswer_attemptId_exerciseItemId_key" ON "UserAnswer"("attemptId", "exerciseItemId");
CREATE INDEX IF NOT EXISTS "UserAnswer_attemptId_idx" ON "UserAnswer"("attemptId");

CREATE TABLE IF NOT EXISTS "ImportRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceName" TEXT NOT NULL,
  "sourceHash" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "setCount" INTEGER NOT NULL DEFAULT 0,
  "itemCount" INTEGER NOT NULL DEFAULT 0,
  "errorsJson" TEXT NOT NULL DEFAULT '[]',
  "warningsJson" TEXT NOT NULL DEFAULT '[]',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
