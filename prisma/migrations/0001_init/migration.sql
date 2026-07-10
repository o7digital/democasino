CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'READ_ONLY',
  "casinoIds" TEXT NOT NULL DEFAULT '[]',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Casino" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ImportBatch" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "filename" TEXT NOT NULL,
  "sha256" TEXT NOT NULL UNIQUE,
  "reportType" TEXT NOT NULL,
  "casinoId" TEXT,
  "periodLabel" TEXT NOT NULL,
  "periodStart" DATETIME,
  "periodEnd" DATETIME,
  "importedById" TEXT,
  "rowCount" INTEGER NOT NULL,
  "validRows" INTEGER NOT NULL,
  "rejectedRows" INTEGER NOT NULL,
  "warningsJson" TEXT NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT 'IMPORTED',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImportBatch_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ImportBatch_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "MonthlyMetric" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "importBatchId" TEXT NOT NULL,
  "casinoId" TEXT NOT NULL,
  "periodLabel" TEXT NOT NULL,
  "periodStart" DATETIME NOT NULL,
  "days" INTEGER NOT NULL,
  "model" TEXT NOT NULL,
  "manufacturer" TEXT NOT NULL,
  "area" TEXT NOT NULL,
  "units" INTEGER NOT NULL,
  "coinIn" REAL NOT NULL,
  "coinInAvg" REAL NOT NULL,
  "netWin" REAL NOT NULL,
  "netWinAvg" REAL NOT NULL,
  "retention" REAL NOT NULL,
  "previousCoinIn" REAL,
  "plays" INTEGER NOT NULL,
  "playsAvg" REAL NOT NULL,
  "dailyCost" REAL NOT NULL,
  "profitPerDay" REAL NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MonthlyMetric_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MonthlyMetric_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "DailyTerminalMetric" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "importBatchId" TEXT NOT NULL,
  "casinoId" TEXT NOT NULL,
  "startedAt" DATETIME NOT NULL,
  "endedAt" DATETIME NOT NULL,
  "manufacturer" TEXT NOT NULL,
  "vendor" TEXT,
  "terminalName" TEXT NOT NULL,
  "plantId" TEXT NOT NULL,
  "denomination" TEXT,
  "location" TEXT,
  "area" TEXT NOT NULL,
  "island" TEXT,
  "position" TEXT,
  "game" TEXT NOT NULL,
  "coinIn" REAL NOT NULL,
  "coinOutJackpots" REAL NOT NULL,
  "totalJackpot" REAL NOT NULL,
  "nonProgressive" REAL NOT NULL,
  "progressive" REAL NOT NULL,
  "provision" REAL NOT NULL,
  "payout" REAL NOT NULL,
  "theoreticalPayout" REAL,
  "netWin" REAL NOT NULL,
  "netWinPct" REAL NOT NULL,
  "plays" INTEGER NOT NULL,
  "wins" INTEGER NOT NULL,
  "winPct" REAL,
  "averageBet" REAL NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DailyTerminalMetric_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DailyTerminalMetric_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AlertRule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "label" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT 1,
  "severity" TEXT NOT NULL DEFAULT 'WARNING',
  "threshold" REAL,
  "minValue" REAL,
  "maxValue" REAL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Alert" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ruleCode" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "metricId" TEXT NOT NULL,
  "value" REAL,
  "message" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Alert_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "DailyTerminalMetric" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "CostConfig" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "casinoId" TEXT NOT NULL,
  "manufacturer" TEXT,
  "model" TEXT,
  "effectiveFrom" DATETIME NOT NULL,
  "dailyCost" REAL NOT NULL,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CostConfig_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "MonthlyMetric_periodLabel_casinoId_idx" ON "MonthlyMetric"("periodLabel", "casinoId");
CREATE INDEX IF NOT EXISTS "MonthlyMetric_manufacturer_idx" ON "MonthlyMetric"("manufacturer");
CREATE INDEX IF NOT EXISTS "MonthlyMetric_area_idx" ON "MonthlyMetric"("area");
CREATE INDEX IF NOT EXISTS "DailyTerminalMetric_casinoId_startedAt_idx" ON "DailyTerminalMetric"("casinoId", "startedAt");
CREATE INDEX IF NOT EXISTS "DailyTerminalMetric_manufacturer_idx" ON "DailyTerminalMetric"("manufacturer");
CREATE INDEX IF NOT EXISTS "DailyTerminalMetric_area_idx" ON "DailyTerminalMetric"("area");
CREATE INDEX IF NOT EXISTS "DailyTerminalMetric_plantId_idx" ON "DailyTerminalMetric"("plantId");
CREATE INDEX IF NOT EXISTS "Alert_ruleCode_idx" ON "Alert"("ruleCode");
CREATE INDEX IF NOT EXISTS "Alert_severity_idx" ON "Alert"("severity");
CREATE INDEX IF NOT EXISTS "CostConfig_casinoId_manufacturer_model_idx" ON "CostConfig"("casinoId", "manufacturer", "model");
