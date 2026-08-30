import { describe, expect, it } from "vitest";

import { formatCurrency, formatDate, normalizeGreekPhone } from "@/lib/format";
import { can, getPermissions } from "@/server/permissions/matrix";

describe("permissions matrix", () => {
  it("OWNER has org:delete permission", () => {
    expect(can("OWNER", "org:delete")).toBe(true);
  });

  it("ADMIN cannot delete organization", () => {
    expect(can("ADMIN", "org:delete")).toBe(false);
    expect(can("ADMIN", "event:create")).toBe(true);
  });

  it("MANAGER can manage guests but not billing", () => {
    expect(can("MANAGER", "guest:update")).toBe(true);
    expect(can("MANAGER", "org:manage_billing")).toBe(false);
  });

  it("VIEWER is read-only", () => {
    const perms = getPermissions("VIEWER");
    expect(perms).toContain("event:read");
    expect(perms).not.toContain("event:create");
    expect(perms).not.toContain("guest:delete");
  });

  it("EDITOR can update events but not delete", () => {
    expect(can("EDITOR", "event:update")).toBe(true);
    expect(can("EDITOR", "event:delete")).toBe(false);
  });
});

describe("Greek phone normalization", () => {
  it("normalizes 10-digit local numbers", () => {
    expect(normalizeGreekPhone("6912345678")).toBe("+306912345678");
  });

  it("normalizes +30 prefix", () => {
    expect(normalizeGreekPhone("+30 691 234 5678")).toBe("+306912345678");
  });

  it("handles 30 prefix without plus", () => {
    expect(normalizeGreekPhone("306912345678")).toBe("+306912345678");
  });

  it("returns null for invalid input", () => {
    expect(normalizeGreekPhone("123")).toBeNull();
    expect(normalizeGreekPhone("")).toBeNull();
  });
});

describe("locale formatters", () => {
  it("formats dates in Greek locale", () => {
    const formatted = formatDate(new Date("2026-06-15"), "el");
    expect(formatted).toMatch(/15/);
    expect(formatted).toMatch(/06|6/);
  });

  it("formats currency in EUR", () => {
    const formatted = formatCurrency(1234.5, "el");
    expect(formatted).toMatch(/1[.\s]?234/);
    expect(formatted).toMatch(/€|EUR/i);
  });
});

describe("tenant isolation contract", () => {
  it("eventScope requires organizationId", async () => {
    const { eventScope } = await import("@/server/repositories/base");
    const scope = eventScope("event-123", "org-456");
    expect(scope).toEqual({
      id: "event-123",
      organizationId: "org-456",
      deletedAt: null,
    });
  });

  it("eventOrganizationScope filters deleted events", async () => {
    const { eventOrganizationScope } = await import("@/server/repositories/base");
    const scope = eventOrganizationScope("org-456");
    expect(scope).toEqual({
      organizationId: "org-456",
      deletedAt: null,
    });
  });
});
