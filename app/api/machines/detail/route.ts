import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getMachineDetailRows } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const model = params.get("model");
  if (!model) return NextResponse.json({ error: "Falta modelo" }, { status: 400 });

  const data = await getMachineDetailRows({
    model,
    period: params.get("period") || undefined,
    casinoId: params.get("casinoId") || undefined,
    area: params.get("area") || undefined,
    manufacturer: params.get("manufacturer") || undefined,
    user: { role: user.role, casinoIds: user.casinoIds, casinoCodes: user.casinoCodes }
  });

  return NextResponse.json(data);
}
