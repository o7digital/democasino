const MONTHS: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11
};

export function parseSpanishPeriod(value: unknown): { label: string; start: Date } {
  const text = String(value ?? "").trim().toLowerCase();
  const [monthName, yearText] = text.split(/\s+/);
  const month = MONTHS[monthName] ?? 0;
  const year = Number(yearText) || new Date().getFullYear();
  const label = `${capitalize(monthName || "enero")} ${year}`;
  return { label, start: new Date(Date.UTC(year, month, 1, 6, 0, 0)) };
}

export function parseSpanishDateTime(value: unknown): Date {
  if (value instanceof Date) return value;
  const text = String(value ?? "").trim();
  const match = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (!match) return new Date(text);
  const [, day, month, year, hour = "0", minute = "0"] = match;
  return new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), 0)
  );
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}
