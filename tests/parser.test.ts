import { describe, expect, it } from "vitest";
import { parseExcelFile } from "@/lib/parser";

describe("real Excel parser", () => {
  it("detects and parses monthly workbook", () => {
    const parsed = parseExcelFile("data/raw/Reporte Mensual.xlsx");
    expect(parsed.type).toBe("MONTHLY");
    expect(parsed.validRows).toBe(91);
    expect(parsed.rejectedRows).toBe(0);
    if (parsed.type === "MONTHLY") {
      const coinIn = parsed.rows.reduce((total, row) => total + row.coinIn, 0);
      const netWin = parsed.rows.reduce((total, row) => total + row.netWin, 0);
      expect(Math.round(coinIn)).toBe(444823635);
      expect(Math.round(netWin)).toBe(27061573);
    }
  });

  it("detects and parses daily workbooks", () => {
    const vh = parseExcelFile("data/raw/Villahermosa 05jun.xlsx");
    const cat = parseExcelFile("data/raw/Coatzacoalcos 05jun.xlsx");
    expect(vh.type).toBe("DAILY");
    expect(cat.type).toBe("DAILY");
    expect(vh.validRows).toBe(230);
    expect(cat.validRows).toBe(214);
    if (vh.type === "DAILY" && cat.type === "DAILY") {
      expect(Math.round(vh.rows.reduce((t, r) => t + r.netWin, 0))).toBe(453758);
      expect(Math.round(cat.rows.reduce((t, r) => t + r.netWin, 0))).toBe(498034);
    }
  });
});
