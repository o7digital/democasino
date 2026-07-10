export function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value == null) return 0;
  const raw = String(value).trim();
  if (!raw) return 0;
  const negative = raw.includes("(") && raw.includes(")");
  const cleaned = raw
    .replace(/[$,%]/g, "")
    .replace(/\s+/g, "")
    .replace(/,/g, "")
    .replace(/[()]/g, "");
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return 0;
  return negative ? -parsed : parsed;
}

export function toPercentRatio(value: unknown): number {
  if (typeof value === "number") return value > 1 ? value / 100 : value;
  const text = String(value ?? "").trim();
  const n = toNumber(text);
  return text.includes("%") ? n / 100 : n;
}

export function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function money(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(value);
}

export function compactMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${value < 0 ? "-" : ""}$${round(abs / 1_000_000, 2)}M`;
  if (abs >= 1_000) return `${value < 0 ? "-" : ""}$${round(abs / 1_000, 0)}K`;
  return money(value);
}

export function pct(value: number, decimals = 2): string {
  return `${round(value * 100, decimals)}%`;
}
