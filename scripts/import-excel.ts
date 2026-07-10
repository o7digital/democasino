import { importExcelFile, seedDefaults } from "@/lib/importer";
import { prisma } from "@/lib/db";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Uso: npm run import:excel -- archivo.xlsx [archivo2.xlsx]");
  process.exit(1);
}

await seedDefaults();
for (const file of files) {
  const result = await importExcelFile(file);
  console.log(JSON.stringify({
    file,
    duplicate: result.duplicate,
    type: result.parsed.type,
    rows: result.parsed.rowCount,
    validRows: result.parsed.validRows,
    rejectedRows: result.parsed.rejectedRows,
    warnings: result.parsed.issues.filter((issue) => issue.severity === "warning").length
  }, null, 2));
}
await prisma.$disconnect();
