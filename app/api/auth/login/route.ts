import { NextResponse } from "next/server";
import { login } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const user = await login(String(body.email ?? ""), String(body.password ?? ""));
  if (!user) return NextResponse.json({ error: "Credenciales invalidas" }, { status: 401 });
  return NextResponse.json({ ok: true, user: { email: user.email, name: user.name, role: user.role } });
}
