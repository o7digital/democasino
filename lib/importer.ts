import fs from "node:fs";
import type { AlertRule, AlertSeverity, Prisma } from "@prisma/client";
import { prisma } from "./db";
import { parseExcelBuffer, parseExcelFile, type DailyParsedRow, type ParsedWorkbook } from "./parser";

export type ImportResult = {
  duplicate: boolean;
  importId?: string;
  parsed: ParsedWorkbook;
};

export async function importExcelFile(filePath: string, userId?: string, allowDuplicate = false) {
  const parsed = parseExcelFile(filePath);
  return persistParsedWorkbook(parsed, userId, allowDuplicate);
}

export async function importExcelUpload(file: File, userId?: string, allowDuplicate = false) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseExcelBuffer(buffer, file.name);
  return persistParsedWorkbook(parsed, userId, allowDuplicate);
}

export async function persistParsedWorkbook(
  parsed: ParsedWorkbook,
  userId?: string,
  allowDuplicate = false
): Promise<ImportResult> {
  const existing = await prisma.importBatch.findUnique({ where: { sha256: parsed.sha256 } });
  if (existing && !allowDuplicate) {
    return { duplicate: true, importId: existing.id, parsed };
  }

  if (parsed.type === "MONTHLY") {
    const importBatch = await prisma.importBatch.create({
      data: {
        filename: parsed.filename,
        sha256: allowDuplicate && existing ? `${parsed.sha256}-${Date.now()}` : parsed.sha256,
        reportType: "MONTHLY",
        periodLabel: parsed.periodLabel,
        periodStart: parsed.periodStart,
        rowCount: parsed.rowCount,
        validRows: parsed.validRows,
        rejectedRows: parsed.rejectedRows,
        warningsJson: JSON.stringify(parsed.issues),
        importedById: userId,
        status: parsed.rejectedRows > 0 ? "VALIDATED" : "IMPORTED"
      }
    });

    for (const row of parsed.rows) {
      const casino = await upsertCasino(row.casinoCode, row.casinoName);
      await prisma.monthlyMetric.create({
        data: {
          importBatchId: importBatch.id,
          casinoId: casino.id,
          periodLabel: row.periodLabel,
          periodStart: row.periodStart,
          days: row.days,
          model: row.model,
          manufacturer: row.manufacturer,
          area: row.area,
          units: row.units,
          coinIn: row.coinIn,
          coinInAvg: row.coinInAvg,
          netWin: row.netWin,
          netWinAvg: row.netWinAvg,
          retention: row.retention,
          previousCoinIn: row.previousCoinIn,
          plays: row.plays,
          playsAvg: row.playsAvg,
          dailyCost: row.dailyCost,
          profitPerDay: row.profitPerDay
        }
      });
    }

    return { duplicate: false, importId: importBatch.id, parsed };
  }

  const casino = await upsertCasino(parsed.casinoCode, parsed.casinoName);
  const importBatch = await prisma.importBatch.create({
    data: {
      filename: parsed.filename,
      sha256: allowDuplicate && existing ? `${parsed.sha256}-${Date.now()}` : parsed.sha256,
      reportType: "DAILY",
      casinoId: casino.id,
      periodLabel: parsed.periodLabel,
      periodStart: parsed.periodStart,
      periodEnd: parsed.periodEnd,
      rowCount: parsed.rowCount,
      validRows: parsed.validRows,
      rejectedRows: parsed.rejectedRows,
      warningsJson: JSON.stringify(parsed.issues),
      importedById: userId,
      status: parsed.rejectedRows > 0 ? "VALIDATED" : "IMPORTED"
    }
  });

  const rules = await prisma.alertRule.findMany({ where: { enabled: true } });
  for (const row of parsed.rows) {
    const metric = await prisma.dailyTerminalMetric.create({
      data: dailyRowToCreate(row, importBatch.id, casino.id)
    });
    const alerts = evaluateAlerts(row, metric.id, rules);
    if (alerts.length) await prisma.alert.createMany({ data: alerts });
  }

  return { duplicate: false, importId: importBatch.id, parsed };
}

export async function seedDefaults() {
  await Promise.all([
    upsertCasino("130", "Villahermosa"),
    upsertCasino("204", "Coatzacoalcos")
  ]);

  const rules: Array<Prisma.AlertRuleCreateInput> = [
    {
      code: "PAYOUT_GT_100",
      label: "Payout superior a 100%",
      severity: "CRITICAL",
      threshold: 1
    },
    {
      code: "NEGATIVE_NETWIN",
      label: "NetWin negativo",
      severity: "WARNING",
      threshold: 0
    },
    {
      code: "NO_ACTIVITY",
      label: "Terminal sin actividad",
      severity: "WARNING",
      threshold: 0
    },
    {
      code: "ZERO_COIN_IN",
      label: "Coin In igual a cero",
      severity: "WARNING",
      threshold: 0
    },
    {
      code: "RETENTION_RANGE",
      label: "Retencion fuera de rango",
      severity: "WARNING",
      minValue: 0.02,
      maxValue: 0.14
    }
  ];

  for (const rule of rules) {
    await prisma.alertRule.upsert({
      where: { code: rule.code },
      create: rule,
      update: rule
    });
  }

  const casinos = await prisma.casino.findMany();
  for (const casino of casinos) {
    await prisma.costConfig.upsert({
      where: { id: `default-${casino.code}` },
      create: {
        id: `default-${casino.code}`,
        casinoId: casino.id,
        effectiveFrom: new Date(Date.UTC(2026, 0, 1)),
        dailyCost: 0,
        notes: "Costo default; ajustar por fabricante o modelo desde configuracion."
      },
      update: {}
    });
  }
}

export async function importBundledExcels() {
  const files = [
    "data/raw/Reporte Mensual.xlsx",
    "data/raw/Villahermosa 05jun.xlsx",
    "data/raw/Coatzacoalcos 05jun.xlsx"
  ];
  const results: ImportResult[] = [];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    results.push(await importExcelFile(file));
  }
  return results;
}

async function upsertCasino(code: string, name: string) {
  return prisma.casino.upsert({
    where: { code },
    create: { code, name },
    update: { name }
  });
}

function dailyRowToCreate(
  row: DailyParsedRow,
  importBatchId: string,
  casinoId: string
): Prisma.DailyTerminalMetricCreateInput {
  return {
    importBatch: { connect: { id: importBatchId } },
    casino: { connect: { id: casinoId } },
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    manufacturer: row.manufacturer,
    vendor: row.vendor,
    terminalName: row.terminalName,
    plantId: row.plantId,
    denomination: row.denomination,
    location: row.location,
    area: row.area,
    island: row.island,
    position: row.position,
    game: row.game,
    coinIn: row.coinIn,
    coinOutJackpots: row.coinOutJackpots,
    totalJackpot: row.totalJackpot,
    nonProgressive: row.nonProgressive,
    progressive: row.progressive,
    provision: row.provision,
    payout: row.payout,
    theoreticalPayout: row.theoreticalPayout,
    netWin: row.netWin,
    netWinPct: row.netWinPct,
    plays: row.plays,
    wins: row.wins,
    winPct: row.winPct,
    averageBet: row.averageBet
  };
}

function evaluateAlerts(
  row: DailyParsedRow,
  metricId: string,
  rules: AlertRule[]
): Prisma.AlertCreateManyInput[] {
  const byCode = new Map(rules.map((rule) => [rule.code, rule]));
  const alerts: Prisma.AlertCreateManyInput[] = [];
  const push = (rule: AlertRule | undefined, value: number | undefined, message: string) => {
    if (!rule || !rule.enabled) return;
    alerts.push({
      metricId,
      ruleCode: rule.code,
      label: rule.label,
      severity: rule.severity as AlertSeverity,
      value,
      message
    });
  };

  const payout = byCode.get("PAYOUT_GT_100");
  if (payout?.threshold != null && row.payout > payout.threshold) {
    push(payout, row.payout, `Payout ${(row.payout * 100).toFixed(2)}% en terminal ${row.plantId}`);
  }

  const negative = byCode.get("NEGATIVE_NETWIN");
  if (negative && row.netWin < 0) {
    push(negative, row.netWin, `NetWin negativo en terminal ${row.plantId}`);
  }

  const noActivity = byCode.get("NO_ACTIVITY");
  if (noActivity && row.plays === 0) {
    push(noActivity, row.plays, `Terminal ${row.plantId} sin jugadas`);
  }

  const zeroCoinIn = byCode.get("ZERO_COIN_IN");
  if (zeroCoinIn && row.coinIn === 0) {
    push(zeroCoinIn, row.coinIn, `Terminal ${row.plantId} sin Coin In`);
  }

  const retention = byCode.get("RETENTION_RANGE");
  if (
    retention &&
    ((retention.minValue != null && row.netWinPct < retention.minValue) ||
      (retention.maxValue != null && row.netWinPct > retention.maxValue))
  ) {
    push(retention, row.netWinPct, `Retencion ${(row.netWinPct * 100).toFixed(2)}% fuera de rango`);
  }

  return alerts;
}
