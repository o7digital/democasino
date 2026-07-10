import { afterEach, describe, expect, it } from "vitest";
import { resolveRole } from "@/lib/auth";

const originalDefaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL;
const originalAdminEmails = process.env.ADMIN_EMAILS;

afterEach(() => {
  process.env.DEFAULT_ADMIN_EMAIL = originalDefaultAdminEmail;
  process.env.ADMIN_EMAILS = originalAdminEmails;
});

describe("auth roles", () => {
  it("uses Clerk public metadata role when present", () => {
    delete process.env.DEFAULT_ADMIN_EMAIL;
    delete process.env.ADMIN_EMAILS;

    expect(resolveRole("OPERATIONS", "user@example.com")).toBe("OPERATIONS");
  });

  it("falls back to READ_ONLY for unknown metadata roles", () => {
    delete process.env.DEFAULT_ADMIN_EMAIL;
    delete process.env.ADMIN_EMAILS;

    expect(resolveRole("OWNER", "user@example.com")).toBe("READ_ONLY");
  });

  it("promotes DEFAULT_ADMIN_EMAIL to ADMIN", () => {
    process.env.DEFAULT_ADMIN_EMAIL = "admin@example.com";
    delete process.env.ADMIN_EMAILS;

    expect(resolveRole(undefined, "Admin@Example.com")).toBe("ADMIN");
  });

  it("promotes ADMIN_EMAILS entries to ADMIN", () => {
    delete process.env.DEFAULT_ADMIN_EMAIL;
    process.env.ADMIN_EMAILS = "one@example.com, two@example.com";

    expect(resolveRole("READ_ONLY", "two@example.com")).toBe("ADMIN");
  });
});
