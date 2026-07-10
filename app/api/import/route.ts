import { NextResponse } from "next/server";
import { canImport, currentUser, ensureImportActor } from "@/lib/auth";
import { importExcelUpload } from "@/lib/importer";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || !canImport(user.role)) {
    return NextResponse.json({ error: "Permiso insuficiente" }, { status: 403 });
  }

  const form = await request.formData();
  const files = form.getAll("files").filter((item): item is File => item instanceof File);
  const allowDuplicate = form.get("allowDuplicate") === "true";
  if (!files.length) return NextResponse.json({ error: "No se recibieron archivos" }, { status: 400 });

  const actor = await ensureImportActor(user);
  const results = [];
  for (const file of files) {
    results.push(await importExcelUpload(file, actor.id, allowDuplicate));
  }

  return NextResponse.json(
    results.map((result) => ({
      duplicate: result.duplicate,
      importId: result.importId,
      type: result.parsed.type,
      filename: result.parsed.filename,
      rows: result.parsed.rowCount,
      validRows: result.parsed.validRows,
      rejectedRows: result.parsed.rejectedRows,
      warnings: result.parsed.issues.filter((issue) => issue.severity === "warning").length,
      errors: result.parsed.issues.filter((issue) => issue.severity === "error").length
    }))
  );
}
