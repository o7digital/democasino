import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { currentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const baseUrl = process.env.APP_URL || request.nextUrl.origin;
  const query = request.nextUrl.searchParams.toString();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1240, height: 1754 } });
    await page.goto(`${baseUrl}/reports/executive/print${query ? `?${query}` : ""}`, {
      waitUntil: "networkidle"
    });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate:
        '<div style="font-size:8px;width:100%;padding:0 35px;color:#53657a;">Keptos Casino Analytics</div>',
      footerTemplate:
        '<div style="font-size:8px;width:100%;padding:0 35px;color:#53657a;display:flex;justify-content:space-between;"><span>Reporte ejecutivo</span><span><span class="pageNumber"></span>/<span class="totalPages"></span></span></div>',
      margin: { top: "46px", right: "28px", bottom: "52px", left: "28px" }
    });
    return new Response(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="keptos-reporte-ejecutivo.pdf"'
      }
    });
  } finally {
    await browser.close();
  }
}
