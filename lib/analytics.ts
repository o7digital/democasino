import { Prisma, Role } from "@prisma/client";
import { prisma } from "./db";
import { safeDivide } from "./numbers";

export type AnalyticsFilters = {
  period?: string;
  casinoId?: string;
  area?: string;
  manufacturer?: string;
  search?: string;
  user?: { role: Role; casinoIds: string[] } | null;
};

export async function getAnalytics(filters: AnalyticsFilters = {}) {
  const accessCasinoIds =
    filters.user?.role === "CASINO_MANAGER" && filters.user.casinoIds.length
      ? filters.user.casinoIds
      : undefined;

  const periods = await prisma.monthlyMetric.findMany({
    select: { periodLabel: true, periodStart: true },
    distinct: ["periodLabel"],
    orderBy: { periodStart: "desc" }
  });
  const selectedPeriod = filters.period || periods[0]?.periodLabel;

  const monthlyWhere: Prisma.MonthlyMetricWhereInput = {
    ...(selectedPeriod ? { periodLabel: selectedPeriod } : {}),
    ...(filters.casinoId ? { casinoId: filters.casinoId } : {}),
    ...(filters.area ? { area: filters.area } : {}),
    ...(filters.manufacturer ? { manufacturer: filters.manufacturer } : {}),
    ...(accessCasinoIds ? { casinoId: { in: accessCasinoIds } } : {})
  };

  const dailyWhere: Prisma.DailyTerminalMetricWhereInput = {
    ...(filters.casinoId ? { casinoId: filters.casinoId } : {}),
    ...(filters.area ? { area: filters.area } : {}),
    ...(filters.manufacturer ? { manufacturer: filters.manufacturer } : {}),
    ...(filters.search
      ? {
          OR: [
            { plantId: { contains: filters.search } },
            { terminalName: { contains: filters.search } },
            { game: { contains: filters.search } },
            { manufacturer: { contains: filters.search } }
          ]
        }
      : {}),
    ...(accessCasinoIds ? { casinoId: { in: accessCasinoIds } } : {})
  };

  const [monthly, daily, casinos, imports, rules] = await Promise.all([
    prisma.monthlyMetric.findMany({ where: monthlyWhere, include: { casino: true } }),
    prisma.dailyTerminalMetric.findMany({
      where: dailyWhere,
      include: { casino: true, alerts: true },
      orderBy: [{ netWin: "asc" }],
      take: 500
    }),
    prisma.casino.findMany({
      where: accessCasinoIds ? { id: { in: accessCasinoIds } } : {},
      orderBy: { name: "asc" }
    }),
    prisma.importBatch.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { casino: true } }),
    prisma.alertRule.findMany({ orderBy: { code: "asc" } })
  ]);

  const totalCoinIn = sum(monthly, "coinIn");
  const totalNetWin = sum(monthly, "netWin");
  const totalUnits = sum(monthly, "units");
  const totalPlays = sum(monthly, "plays");
  const days = monthly[0]?.days ?? 0;

  const overview = {
    period: selectedPeriod ?? "Sin periodo",
    totalCoinIn,
    totalNetWin,
    retention: safeDivide(totalNetWin, totalCoinIn),
    totalPlays,
    profitPerDay: safeDivide(totalNetWin, days || 1),
    activeMachines: totalUnits,
    casinoCount: new Set(monthly.map((row) => row.casinoId)).size,
    days
  };

  const byCasino = groupMonthly(monthly, (row) => row.casino.name).map((row) => ({
    ...row,
    casinoId: monthly.find((metric) => metric.casino.name === row.name)?.casinoId
  }));
  const byManufacturer = groupMonthly(monthly, (row) => row.manufacturer).sort(
    (a, b) => b.netWin - a.netWin
  );
  const byArea = groupMonthly(monthly, (row) => row.area).sort((a, b) => b.netWin - a.netWin);
  const topModels = [...monthly].sort((a, b) => b.netWin - a.netWin).slice(0, 10);
  const bottomModels = [...monthly].sort((a, b) => a.netWin - b.netWin).slice(0, 10);

  const alertSummary = daily.reduce<Record<string, number>>((acc, row) => {
    if (row.alerts.length === 0) acc.OK = (acc.OK ?? 0) + 1;
    for (const alert of row.alerts) acc[alert.ruleCode] = (acc[alert.ruleCode] ?? 0) + 1;
    return acc;
  }, {});

  return {
    filters: {
      periods: periods.map((period) => period.periodLabel),
      casinos,
      areas: distinct(monthly.map((row) => row.area)),
      manufacturers: distinct(monthly.map((row) => row.manufacturer)),
      selected: filters
    },
    overview,
    byCasino,
    byManufacturer,
    byArea,
    topModels,
    bottomModels,
    daily,
    alertSummary,
    imports,
    rules
  };
}

export async function getTerminalExportRows(filters: AnalyticsFilters = {}) {
  const data = await getAnalytics(filters);
  return data.daily.map((row) => ({
    casino: row.casino.name,
    plantId: row.plantId,
    manufacturer: row.manufacturer,
    model: row.terminalName,
    area: row.area,
    island: row.island ?? "",
    position: row.position ?? "",
    game: row.game,
    coinIn: row.coinIn,
    coinOut: row.coinOutJackpots,
    netWin: row.netWin,
    payout: row.payout,
    theoreticalPayout: row.theoreticalPayout ?? "",
    plays: row.plays,
    averageBet: row.averageBet,
    alerts: row.alerts.map((alert) => alert.label).join(" | ") || "OK"
  }));
}

function sum<T extends Record<string, unknown>>(rows: T[], key: keyof T): number {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

function distinct(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function groupMonthly<T extends { coinIn: number; netWin: number; units: number; plays: number; days: number }>(
  rows: T[],
  getName: (row: T) => string
) {
  const groups = new Map<string, { name: string; coinIn: number; netWin: number; units: number; plays: number; days: number }>();
  for (const row of rows) {
    const name = getName(row);
    const current = groups.get(name) ?? { name, coinIn: 0, netWin: 0, units: 0, plays: 0, days: row.days };
    current.coinIn += row.coinIn;
    current.netWin += row.netWin;
    current.units += row.units;
    current.plays += row.plays;
    current.days = row.days;
    groups.set(name, current);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    retention: safeDivide(group.netWin, group.coinIn),
    coinInPerMachineDay: safeDivide(group.coinIn, group.units * group.days),
    netWinPerMachineDay: safeDivide(group.netWin, group.units * group.days),
    profitPerDay: safeDivide(group.netWin, group.days)
  }));
}
