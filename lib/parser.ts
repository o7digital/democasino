import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { z } from "zod";
import { parseSpanishDateTime, parseSpanishPeriod } from "./dates";
import { round, safeDivide, toNumber, toPercentRatio } from "./numbers";

export type ParsedWorkbook = ParsedMonthlyWorkbook | ParsedDailyWorkbook;

export type ValidationIssue = {
  row: number;
  field?: string;
  message: string;
  severity: "error" | "warning";
};

export type ParsedMonthlyWorkbook = {
  type: "MONTHLY";
  filename: string;
  sha256: string;
  periodLabel: string;
  periodStart: Date;
  days: number;
  rowCount: number;
  validRows: number;
  rejectedRows: number;
  issues: ValidationIssue[];
  rows: MonthlyParsedRow[];
};

export type MonthlyParsedRow = {
  casinoCode: string;
  casinoName: string;
  periodLabel: string;
  periodStart: Date;
  days: number;
  model: string;
  manufacturer: string;
  area: string;
  units: number;
  coinIn: number;
  coinInAvg: number;
  netWin: number;
  netWinAvg: number;
  retention: number;
  previousCoinIn?: number;
  plays: number;
  playsAvg: number;
  dailyCost: number;
  profitPerDay: number;
};

export type ParsedDailyWorkbook = {
  type: "DAILY";
  filename: string;
  sha256: string;
  casinoCode: string;
  casinoName: string;
  periodLabel: string;
  periodStart: Date;
  periodEnd: Date;
  rowCount: number;
  validRows: number;
  rejectedRows: number;
  issues: ValidationIssue[];
  rows: DailyParsedRow[];
};

export type DailyParsedRow = {
  casinoCode: string;
  casinoName: string;
  startedAt: Date;
  endedAt: Date;
  manufacturer: string;
  vendor?: string;
  terminalName: string;
  plantId: string;
  denomination?: string;
  location?: string;
  area: string;
  island?: string;
  position?: string;
  game: string;
  coinIn: number;
  coinOutJackpots: number;
  totalJackpot: number;
  nonProgressive: number;
  progressive: number;
  provision: number;
  payout: number;
  theoreticalPayout?: number;
  netWin: number;
  netWinPct: number;
  plays: number;
  wins: number;
  winPct?: number;
  averageBet: number;
};

const monthlySchema = z.object({
  model: z.string().min(1),
  area: z.string().min(1),
  units: z.number().int().positive(),
  coinIn: z.number().nonnegative(),
  netWin: z.number(),
  plays: z.number().int().nonnegative()
});

const dailySchema = z.object({
  manufacturer: z.string().min(1),
  terminalName: z.string().min(1),
  plantId: z.string().min(1),
  area: z.string().min(1),
  game: z.string().min(1),
  coinIn: z.number().nonnegative(),
  coinOutJackpots: z.number().nonnegative(),
  plays: z.number().int().nonnegative()
});

const CASINO_CODES: Record<string, string> = {
  villahermosa: "130",
  coatzacoalcos: "204"
};

export function parseExcelFile(filePath: string): ParsedWorkbook {
  const buffer = fs.readFileSync(filePath);
  return parseExcelBuffer(buffer, path.basename(filePath));
}

export function parseExcelBuffer(buffer: Buffer, filename: string): ParsedWorkbook {
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  const workbook = XLSX.read(buffer, { cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const firstRows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
    header: 1,
    raw: false,
    defval: ""
  });
  const firstText = firstRows
    .slice(0, 8)
    .flat()
    .join(" ")
    .toLowerCase();

  if (firstText.includes("id en planta") || firstText.includes("coin-out + jackpots")) {
    return parseDaily(workbook, filename, sha256);
  }

  return parseMonthly(workbook, filename, sha256);
}

function parseMonthly(
  workbook: XLSX.WorkBook,
  filename: string,
  sha256: string
): ParsedMonthlyWorkbook {
  const rows: MonthlyParsedRow[] = [];
  const issues: ValidationIssue[] = [];
  let periodLabel = "";
  let periodStart = new Date();
  let days = 0;
  let rowCount = 0;
  let rejectedRows = 0;

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      raw: false,
      defval: ""
    });
    const casinoName = normalizeCasinoName(sheetName);
    const casinoCode = CASINO_CODES[casinoName.toLowerCase()] ?? sheetName;
    const period = parseSpanishPeriod(sheetRows[1]?.[0]);
    periodLabel = period.label;
    periodStart = period.start;
    days = Math.trunc(toNumber(sheetRows[1]?.[7])) || 31;

    for (let i = 3; i < sheetRows.length; i += 1) {
      const row = sheetRows[i];
      const model = String(row?.[2] ?? "").trim();
      if (!model || model.toUpperCase().includes("TOTAL/MEDIA")) break;
      rowCount += 1;

      const parsed: MonthlyParsedRow = {
        casinoCode,
        casinoName,
        periodLabel,
        periodStart,
        days,
        model,
        manufacturer: inferManufacturer(model),
        area: String(row[3] ?? "").trim() || "Sin area",
        units: Math.trunc(toNumber(row[4])),
        coinIn: toNumber(row[5]),
        coinInAvg: toNumber(row[6]),
        netWin: toNumber(row[7]),
        netWinAvg: toNumber(row[8]),
        retention: toPercentRatio(row[9]),
        previousCoinIn: toNumber(row[10]) || undefined,
        plays: Math.trunc(toNumber(row[11])),
        playsAvg: toNumber(row[12]),
        dailyCost: toNumber(row[13]),
        profitPerDay: toNumber(row[14])
      };

      const validation = monthlySchema.safeParse(parsed);
      if (!validation.success) {
        rejectedRows += 1;
        issues.push({
          row: i + 1,
          severity: "error",
          message: validation.error.issues.map((issue) => issue.message).join("; ")
        });
        continue;
      }

      const computedCoinInAvg = safeDivide(parsed.coinIn, parsed.units * days);
      const computedNetWinAvg = safeDivide(parsed.netWin, parsed.units * days);
      const computedRetention = safeDivide(parsed.netWin, parsed.coinIn);
      const computedProfit = computedNetWinAvg - parsed.dailyCost;
      addToleranceWarning(issues, i + 1, "coinInAvg", parsed.coinInAvg, computedCoinInAvg, 1);
      addToleranceWarning(issues, i + 1, "netWinAvg", parsed.netWinAvg, computedNetWinAvg, 1);
      addToleranceWarning(issues, i + 1, "retention", parsed.retention, computedRetention, 0.002);
      addToleranceWarning(issues, i + 1, "profitPerDay", parsed.profitPerDay, computedProfit, 2);

      rows.push({
        ...parsed,
        coinInAvg: round(computedCoinInAvg, 2),
        netWinAvg: round(computedNetWinAvg, 2),
        retention: computedRetention,
        profitPerDay: round(computedProfit, 2)
      });
    }
  }

  return {
    type: "MONTHLY",
    filename,
    sha256,
    periodLabel,
    periodStart,
    days,
    rowCount,
    validRows: rows.length,
    rejectedRows,
    issues,
    rows
  };
}

function parseDaily(workbook: XLSX.WorkBook, filename: string, sha256: string): ParsedDailyWorkbook {
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: false,
    defval: ""
  });
  const title = String(sheetRows[0]?.[0] ?? "");
  const titleMatch = title.match(/(\d+)\s*-\s*([A-ZÁÉÍÓÚÑ\s]+)/i);
  const casinoCode = titleMatch?.[1] ?? "SIN-CODIGO";
  const casinoName = normalizeCasinoName(titleMatch?.[2] ?? filename.replace(/\.xlsx$/i, ""));

  const firstData = sheetRows[6] ?? [];
  const periodStart = parseSpanishDateTime(firstData[0]);
  const periodEnd = parseSpanishDateTime(firstData[1]);
  const periodLabel = `${periodStart.toISOString().slice(0, 10)} a ${periodEnd
    .toISOString()
    .slice(0, 10)}`;
  const rows: DailyParsedRow[] = [];
  const issues: ValidationIssue[] = [];
  let rowCount = 0;
  let rejectedRows = 0;

  for (let i = 6; i < sheetRows.length; i += 1) {
    const row = sheetRows[i];
    const first = String(row?.[0] ?? "").trim();
    if (!first || first.toUpperCase().startsWith("TOTAL")) break;
    rowCount += 1;

    const parsed: DailyParsedRow = {
      casinoCode,
      casinoName,
      startedAt: parseSpanishDateTime(row[0]),
      endedAt: parseSpanishDateTime(row[1]),
      manufacturer: String(row[2] ?? "").trim(),
      vendor: String(row[3] ?? "").trim() || undefined,
      terminalName: String(row[4] ?? "").trim(),
      plantId: String(row[5] ?? "").trim(),
      denomination: String(row[6] ?? "").trim() || undefined,
      location: String(row[7] ?? "").trim() || undefined,
      area: String(row[8] ?? "").trim() || "Sin area",
      island: String(row[9] ?? "").trim() || undefined,
      position: String(row[10] ?? "").trim() || undefined,
      game: String(row[11] ?? "").trim() || "UNKNOWN",
      coinIn: toNumber(row[12]),
      coinOutJackpots: toNumber(row[13]),
      totalJackpot: toNumber(row[14]),
      nonProgressive: toNumber(row[15]),
      progressive: toNumber(row[16]),
      provision: toNumber(row[17]),
      payout: toPercentRatio(row[18]),
      theoreticalPayout: row[19] === "" ? undefined : toPercentRatio(row[19]),
      netWin: toNumber(row[20]),
      netWinPct: toPercentRatio(row[21]),
      plays: Math.trunc(toNumber(row[22])),
      wins: Math.trunc(toNumber(row[23])),
      winPct: row[24] === "" ? undefined : toPercentRatio(row[24]),
      averageBet: toNumber(row[25])
    };

    const validation = dailySchema.safeParse(parsed);
    if (!validation.success) {
      rejectedRows += 1;
      issues.push({
        row: i + 1,
        severity: "error",
        message: validation.error.issues.map((issue) => issue.message).join("; ")
      });
      continue;
    }

    const computedNetWin = parsed.coinIn - parsed.coinOutJackpots;
    const computedPayout = safeDivide(parsed.coinOutJackpots, parsed.coinIn);
    const computedNetWinPct = safeDivide(computedNetWin, parsed.coinIn);
    const computedAverageBet = safeDivide(parsed.coinIn, parsed.plays);
    addToleranceWarning(issues, i + 1, "netWin", parsed.netWin, computedNetWin, 0.02);
    addToleranceWarning(issues, i + 1, "payout", parsed.payout, computedPayout, 0.002);
    addToleranceWarning(issues, i + 1, "netWinPct", parsed.netWinPct, computedNetWinPct, 0.002);
    addToleranceWarning(issues, i + 1, "averageBet", parsed.averageBet, computedAverageBet, 0.02);

    rows.push({
      ...parsed,
      netWin: round(computedNetWin, 2),
      payout: computedPayout,
      netWinPct: computedNetWinPct,
      averageBet: round(computedAverageBet, 2)
    });
  }

  return {
    type: "DAILY",
    filename,
    sha256,
    casinoCode,
    casinoName,
    periodLabel,
    periodStart,
    periodEnd,
    rowCount,
    validRows: rows.length,
    rejectedRows,
    issues,
    rows
  };
}

function addToleranceWarning(
  issues: ValidationIssue[],
  row: number,
  field: string,
  sourceValue: number,
  computedValue: number,
  tolerance: number
) {
  if (Math.abs(sourceValue - computedValue) <= tolerance) return;
  issues.push({
    row,
    field,
    severity: "warning",
    message: `${field}: Excel=${round(sourceValue, 4)} recalculado=${round(computedValue, 4)}`
  });
}

export function inferManufacturer(model: string): string {
  const normalized = model.trim().toUpperCase();
  const known = [
    "AINSWORTH",
    "APEX",
    "BALLY",
    "EIBE",
    "EGT",
    "GOLDCLUB",
    "IGT",
    "LUDICUS",
    "NOVOMATIC",
    "WMS",
    "ZITRO"
  ];
  return known.find((brand) => normalized.startsWith(brand)) ?? normalized.split(/\s+/)[0] ?? "OTROS";
}

function normalizeCasinoName(value: string): string {
  const normalized = value.trim().replace(/^SALA\s+/i, "").toLowerCase();
  if (normalized.includes("villa")) return "Villahermosa";
  if (normalized.includes("coatza")) return "Coatzacoalcos";
  return value.trim();
}
