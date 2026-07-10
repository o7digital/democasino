import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const cookieName = "keptos_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret");

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    casinoIds: JSON.parse(user.casinoIds || "[]")
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);

  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
  return user;
}

export async function logout() {
  (await cookies()).delete(cookieName);
}

export async function currentUser() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as "ADMIN" | "EXECUTIVE" | "CASINO_MANAGER" | "OPERATIONS" | "READ_ONLY",
      casinoIds: Array.isArray(payload.casinoIds) ? payload.casinoIds.map(String) : []
    };
  } catch {
    return null;
  }
}

export function canImport(role: string) {
  return role === "ADMIN";
}

export function canExportTerminals(role: string) {
  return ["ADMIN", "EXECUTIVE", "OPERATIONS"].includes(role);
}
