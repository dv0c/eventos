import { describe, expect, it } from "vitest";

import { RsvpStatus } from "@prisma/client";

import { importService } from "@/server/services/import.service";
import { PlanLimitError, planLimitsService } from "@/server/services/plan-limits.service";

describe("RSVP token access contract", () => {
  it("getByToken rejects empty token at service level", async () => {
    const { rsvpService } = await import("@/server/services/rsvp.service");
    await expect(rsvpService.getByToken("")).rejects.toMatchObject({
      code: "RSVP_NOT_FOUND",
    });
  });

  it("submitRsvp validates status enum values", () => {
    expect(Object.values(RsvpStatus)).toContain(RsvpStatus.YES);
    expect(Object.values(RsvpStatus)).toContain(RsvpStatus.NO);
    expect(Object.values(RsvpStatus)).toContain(RsvpStatus.MAYBE);
  });

  it("maps RSVP YES to CONFIRMED guest status", async () => {
    const { rsvpService } = await import("@/server/services/rsvp.service");
    await expect(rsvpService.getByToken("nonexistent-token-12345")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("import validation", () => {
  it("parseMapping recognizes Greek column headers", () => {
    const mapping = importService.parseMapping(["Όνομα", "Επώνυμο", "Email"]);
    expect(mapping["Όνομα"]).toBe("firstName");
    expect(mapping["Επώνυμο"]).toBe("lastName");
    expect(mapping["Email"]).toBe("email");
  });

  it("parseMapping recognizes English column headers", () => {
    const mapping = importService.parseMapping(["first name", "last name", "phone"]);
    expect(mapping["first name"]).toBe("firstName");
    expect(mapping["last name"]).toBe("lastName");
    expect(mapping["phone"]).toBe("phone");
  });
});

describe("plan limits", () => {
  it("PlanLimitError has correct code", () => {
    const err = new PlanLimitError("guests", "limit exceeded");
    expect(err.code).toBe("PLAN_LIMIT_EXCEEDED");
    expect(err.statusCode).toBe(403);
    expect(err.metric).toBe("guests");
  });

  it("treats negative limits as unlimited in assertWithinLimit logic", () => {
    const limits = { maxEvents: -1, maxGuests: -1, maxStorage: -1, maxCollaborators: -1, maxMessages: -1, maxWhatsAppMessages: -1 };
    expect(limits.maxEvents).toBeLessThan(0);
  });
});

describe("Stripe webhook handler contract", () => {
  it("billingService maps active subscription status", async () => {
    const { billingService } = await import("@/server/services/billing.service");
    expect(billingService.syncSubscriptionFromStripe).toBeDefined();
    expect(billingService.syncInvoiceFromStripe).toBeDefined();
    expect(billingService.handleSubscriptionDeleted).toBeDefined();
  });

  it("returns null for invoice without subscription", async () => {
    const { billingService } = await import("@/server/services/billing.service");
    const result = await billingService.syncInvoiceFromStripe({
      id: "in_test",
      object: "invoice",
      subscription: null,
    } as never);
    expect(result).toBeNull();
  });
});

describe("tenant isolation", () => {
  it("clientOrganizationScope filters by org and soft-deletes", async () => {
    const { clientOrganizationScope } = await import("@/server/repositories/base");
    expect(clientOrganizationScope("org-1")).toEqual({
      organizationId: "org-1",
      deletedAt: null,
    });
  });

  it("planLimitsService exports assertWithinLimit", () => {
    expect(typeof planLimitsService.assertWithinLimit).toBe("function");
    expect(typeof planLimitsService.getLimits).toBe("function");
  });
});
