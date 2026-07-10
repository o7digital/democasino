import { NextRequest, NextResponse } from "next/server";
import { getAnalytics } from "@/lib/analytics";
import { currentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await currentUser();
  const params = request.nextUrl.searchParams;
  const data = await getAnalytics({
    period: params.get("period") || undefined,
    casinoId: params.get("casinoId") || undefined,
    area: params.get("area") || undefined,
    manufacturer: params.get("manufacturer") || undefined,
    search: params.get("search") || undefined,
    user: user ? { role: user.role, casinoIds: user.casinoIds } : null
  });
  return NextResponse.json(data);
}
