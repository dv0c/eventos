import { OrgRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
const findFirst = vi.fn();
const eventCount = vi.fn();

vi.mock("@/server/db", () => ({
  prisma: {
    organizationMember: { findMany, findFirst },
    organization: { findFirst },
    plan: { findFirst },
    event: { count: eventCount },
    usageRecord: { findFirst: vi.fn().mockResolvedValue(null) },
  },
}));

describe("plan org and free-event caps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("assertCanCreateOrganization blocks a second org on free maxOrgs=1", async () => {
    findMany.mockResolvedValue([
      {
        organization: {
          plan: { limits: { maxEvents: 3, maxOrgs: 1 } },
        },
      },
    ]);

    const { planLimitsService, PlanLimitError } = await import(
      "@/server/services/plan-limits.service"
    );

    await expect(
      planLimitsService.assertCanCreateOrganization("user-1"),
    ).rejects.toMatchObject({
      name: "PlanLimitError",
      metric: "orgs",
      code: "PLAN_LIMIT_EXCEEDED",
    } satisfies Partial<InstanceType<typeof PlanLimitError>>);
  });

  it("assertEventCreateAllowed blocks after 3 owned events", async () => {
    findMany.mockResolvedValue([
      { organizationId: "org-a" },
      { organizationId: "org-b" },
    ]);
    eventCount.mockResolvedValue(3);

    const { planLimitsService } = await import(
      "@/server/services/plan-limits.service"
    );
    const { FreeQuotaExceededError } = await import(
      "@/server/events/event-entitlement"
    );

    await expect(
      planLimitsService.assertEventCreateAllowed("user-1", "org-b"),
    ).rejects.toBeInstanceOf(FreeQuotaExceededError);

    expect(eventCount).toHaveBeenCalledWith({
      where: {
        organizationId: { in: ["org-a", "org-b"] },
        deletedAt: null,
      },
    });
    expect(OrgRole.OWNER).toBe("OWNER");
  });

  it("assertEventCreateAllowed allows create under free quota", async () => {
    findMany.mockResolvedValue([{ organizationId: "org-a" }]);
    eventCount.mockResolvedValue(2);

    const { planLimitsService } = await import(
      "@/server/services/plan-limits.service"
    );

    await expect(
      planLimitsService.assertEventCreateAllowed("user-1", "org-a"),
    ).resolves.toBeUndefined();
  });
});
