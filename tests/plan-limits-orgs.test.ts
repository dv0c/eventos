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
          plan: { limits: { maxEvents: 1, maxOrgs: 1 } },
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

  it("assertEventCreateAllowed sums events across free orgs the user owns", async () => {
    findFirst.mockResolvedValue({
      id: "org-b",
      plan: { slug: "free", limits: { maxEvents: 1, maxOrgs: 1 } },
    });
    findMany.mockResolvedValue([
      {
        organization: {
          id: "org-a",
          plan: { slug: "free", limits: { maxEvents: 1, maxOrgs: 1 } },
        },
      },
      {
        organization: {
          id: "org-b",
          plan: { slug: "free", limits: { maxEvents: 1, maxOrgs: 1 } },
        },
      },
    ]);
    eventCount.mockResolvedValue(1);

    const { planLimitsService } = await import(
      "@/server/services/plan-limits.service"
    );

    await expect(
      planLimitsService.assertEventCreateAllowed("user-1", "org-b"),
    ).rejects.toMatchObject({
      metric: "events",
      code: "PLAN_LIMIT_EXCEEDED",
    });

    expect(eventCount).toHaveBeenCalledWith({
      where: {
        organizationId: { in: ["org-a", "org-b"] },
        deletedAt: null,
      },
    });
    expect(OrgRole.OWNER).toBe("OWNER");
  });
});
