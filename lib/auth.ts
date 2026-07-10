import type { Role } from "@prisma/client";
import { currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { prisma } from "./db";

const roles = new Set<Role>([
  "ADMIN",
  "EXECUTIVE",
  "CASINO_MANAGER",
  "OPERATIONS",
  "READ_ONLY"
]);

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  casinoIds: string[];
  casinoCodes: string[];
};

export async function currentUser(): Promise<AppUser | null> {
  const user = await clerkCurrentUser();
  if (!user) return null;

  const metadata = user.publicMetadata as Record<string, unknown>;
  const role = roles.has(metadata.role as Role) ? (metadata.role as Role) : "READ_ONLY";
  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  return {
    id: user.id,
    email,
    name: user.fullName || user.username || email,
    role,
    casinoIds: stringArray(metadata.casinoIds),
    casinoCodes: stringArray(metadata.casinoCodes)
  };
}

export async function ensureImportActor(user: AppUser) {
  return prisma.user.upsert({
    where: { email: user.email },
    create: {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: "",
      role: user.role,
      casinoIds: JSON.stringify(user.casinoIds)
    },
    update: {
      name: user.name,
      role: user.role,
      casinoIds: JSON.stringify(user.casinoIds)
    }
  });
}

export function canImport(role: Role) {
  return role === "ADMIN";
}

export function canExportTerminals(role: Role) {
  return ["ADMIN", "EXECUTIVE", "OPERATIONS"].includes(role);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
