import { seedDefaults, importBundledExcels } from "@/lib/importer";
import { prisma } from "@/lib/db";

await seedDefaults();
const results = await importBundledExcels();
for (const result of results) {
  console.log(
    `${result.parsed.filename}: ${result.parsed.type} rows=${result.parsed.rowCount} valid=${result.parsed.validRows} rejected=${result.parsed.rejectedRows} duplicate=${result.duplicate}`
  );
}
console.log(`Casinos: ${await prisma.casino.count()}`);
console.log(`Monthly rows: ${await prisma.monthlyMetric.count()}`);
console.log(`Daily rows: ${await prisma.dailyTerminalMetric.count()}`);
console.log(`Alerts: ${await prisma.alert.count()}`);
await prisma.$disconnect();
