import * as XLSX from "xlsx";
import { NextRequest, NextResponse } from "next/server";
import { canExportTerminals, currentUser } from "@/lib/auth";
import { getTerminalExportRows } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user || !canExportTerminals(user.role)) {
    return NextResponse.json({ error: "Permiso insuficiente" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const rows = await getTerminalExportRows({
    period: params.get("period") || undefined,
    casinoId: params.get("casinoId") || undefined,
    area: params.get("area") || undefined,
    manufacturer: params.get("manufacturer") || undefined,
    search: params.get("search") || undefined,
    user: { role: user.role, casinoIds: user.casinoIds }
  });

  const format = params.get("format") || "csv";
  if (format === "xlsx") {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Terminales");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
    return new Response(buffer, {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": 'attachment; filename="keptos-terminales.xlsx"'
      }
    });
  }

  const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(rows));
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="keptos-terminales.csv"'
    }
  });
}
