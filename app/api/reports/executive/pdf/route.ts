import { NextRequest, NextResponse } from "next/server";
import serverlessChromium from "@sparticuz/chromium";
import { chromium } from "playwright-core";
import { currentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const baseUrl = process.env.APP_URL || request.nextUrl.origin;
  const query = request.nextUrl.searchParams.toString();
  const browser = await chromium.launch({
    args: serverlessChromium.args,
    executablePath: await getChromiumExecutablePath(),
    headless: true
  });
  try {
    const context = await browser.newContext({ viewport: { width: 1240, height: 1754 } });
    const sessionCookies = request.cookies.getAll().map(({ name, value }) => ({
      name,
      value,
      url: baseUrl
    }));
    if (sessionCookies.length) await context.addCookies(sessionCookies);
    const page = await context.newPage();
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

async function getChromiumExecutablePath() {
  if (process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return serverlessChromium.executablePath();
  }
  return undefined;
}
