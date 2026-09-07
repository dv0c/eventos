import { OrgRole } from "@prisma/client";

import { prisma } from "@/server/db";

export interface PlanLimits {
  maxEvents: number;
  maxOrgs: number;
  maxGuests: number;
  maxStorage: number;
  maxCollaborators: number;
  maxMessages: number;
  maxWhatsAppMessages: number;
}

export type LimitMetric =
  | "events"
  | "orgs"
  | "guests"
  | "storage"
  | "messages"
  | "whatsapp"
  | "collaborators";

export class PlanLimitError extends Error {
  readonly statusCode = 403;
  readonly code = "PLAN_LIMIT_EXCEEDED";
  readonly metric: LimitMetric;

  constructor(metric: LimitMetric, message: string) {
    super(message);
    this.name = "PlanLimitError";
    this.metric = metric;
  }
}

const DEFAULT_LIMITS: PlanLimits = {
  maxEvents: 1,
  maxOrgs: 1,
  maxGuests: 50,
  maxStorage: 500,
  maxCollaborators: 1,
  maxMessages: 100,
  maxWhatsAppMessages: 0,
};

function parseLimits(raw: unknown): PlanLimits {
  if (!raw || typeof raw !== "object") return DEFAULT_LIMITS;
  const obj = raw as Record<string, unknown>;
  return {
    maxEvents: Number(obj.maxEvents ?? DEFAULT_LIMITS.maxEvents),
    maxOrgs: Number(obj.maxOrgs ?? DEFAULT_LIMITS.maxOrgs),
    maxGuests: Number(obj.maxGuests ?? DEFAULT_LIMITS.maxGuests),
    maxStorage: Number(obj.maxStorage ?? DEFAULT_LIMITS.maxStorage),
    maxCollaborators: Number(obj.maxCollaborators ?? DEFAULT_LIMITS.maxCollaborators),
    maxMessages: Number(obj.maxMessages ?? DEFAULT_LIMITS.maxMessages),
    maxWhatsAppMessages: Number(
      obj.maxWhatsAppMessages ?? DEFAULT_LIMITS.maxWhatsAppMessages,
    ),
  };
}

function isUnlimited(value: number): boolean {
  return value < 0;
}

function getCurrentPeriod(): { periodStart: Date; periodEnd: Date } {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { periodStart, periodEnd };
}

function limitKeyForMetric(metric: LimitMetric): keyof PlanLimits {
  switch (metric) {
    case "events":
      return "maxEvents";
    case "orgs":
      return "maxOrgs";
    case "guests":
      return "maxGuests";
    case "storage":
      return "maxStorage";
    case "messages":
      return "maxMessages";
    case "whatsapp":
      return "maxWhatsAppMessages";
    case "collaborators":
      return "maxCollaborators";
  }
}

function isFreePlan(plan: { slug: string }): boolean {
  return plan.slug === "free";
}

export const planLimitsService = {
  async getLimits(organizationId: string): Promise<PlanLimits> {
    const org = await prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      include: { plan: true },
    });
    if (!org) return DEFAULT_LIMITS;
    return parseLimits(org.plan.limits);
  },

  async getUsage(organizationId: string, metric: LimitMetric): Promise<number> {
    if (metric === "orgs") {
      return 0;
    }

    const { periodStart, periodEnd } = getCurrentPeriod();

    const usageRecord = await prisma.usageRecord.findFirst({
      where: {
        organizationId,
        metric,
        periodStart: { lte: periodStart },
        periodEnd: { gte: periodEnd },
      },
    });

    // Prefer live counts for hard create limits so stale usage rows cannot bypass caps.
    if (metric !== "events" && usageRecord) {
      return usageRecord.value;
    }

    switch (metric) {
      case "events":
        return prisma.event.count({
          where: { organizationId, deletedAt: null },
        });
      case "guests":
        return prisma.guest.count({
          where: {
            event: { organizationId, deletedAt: null },
            deletedAt: null,
          },
        });
      case "messages":
        return prisma.message.count({
          where: { event: { organizationId, deletedAt: null } },
        });
      case "storage":
        return prisma.media
          .aggregate({
            where: { event: { organizationId, deletedAt: null } },
            _sum: { fileSize: true },
          })
          .then((r) => Math.ceil((r._sum.fileSize ?? 0) / (1024 * 1024)));
      case "collaborators":
        return prisma.organizationMember.count({
          where: { organizationId },
        });
      case "whatsapp":
        return prisma.whatsAppMessage.count({
          where: {
            conversation: {
              eventId: { not: null },
            },
          },
        });
      default:
        return 0;
    }
  },

  async assertWithinLimit(
    organizationId: string,
    metric: LimitMetric,
    increment = 1,
  ): Promise<void> {
    if (metric === "orgs") {
      return;
    }

    const limits = await this.getLimits(organizationId);
    const limitKey = limitKeyForMetric(metric);
    const max = limits[limitKey];

    if (isUnlimited(max)) return;

    const current = await this.getUsage(organizationId, metric);
    if (current + increment > max) {
      throw new PlanLimitError(
        metric,
        `Plan limit exceeded for ${metric}. Current: ${current}, limit: ${max}`,
      );
    }
  },

  /**
   * Free-tier users cannot multiply the 1-event quota by creating more orgs:
   * event counts are summed across all free orgs the user owns.
   * Paid orgs keep per-org maxEvents.
   */
  async assertEventCreateAllowed(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    const org = await prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      include: { plan: true },
    });

    if (!org) {
      throw new PlanLimitError("events", "Organization not found");
    }

    const limits = parseLimits(org.plan.limits);
    if (isUnlimited(limits.maxEvents)) return;

    if (!isFreePlan(org.plan)) {
      await this.assertWithinLimit(organizationId, "events");
      return;
    }

    const owned = await prisma.organizationMember.findMany({
      where: {
        userId,
        role: OrgRole.OWNER,
        organization: { deletedAt: null },
      },
      select: {
        organization: {
          select: {
            id: true,
            plan: { select: { slug: true, limits: true } },
          },
        },
      },
    });

    const freeOrgIds = owned
      .filter((row) => isFreePlan(row.organization.plan))
      .map((row) => row.organization.id);

    const ids = freeOrgIds.includes(organizationId)
      ? freeOrgIds
      : [...freeOrgIds, organizationId];

    const current = await prisma.event.count({
      where: { organizationId: { in: ids }, deletedAt: null },
    });

    if (current + 1 > limits.maxEvents) {
      throw new PlanLimitError(
        "events",
        `Plan limit exceeded for events. Current: ${current}, limit: ${limits.maxEvents}`,
      );
    }
  },

  /**
   * Cap how many orgs a user may own. Uses the highest maxOrgs among owned
   * plans (or the free plan defaults when they own none).
   */
  async assertCanCreateOrganization(userId: string): Promise<void> {
    const owned = await prisma.organizationMember.findMany({
      where: {
        userId,
        role: OrgRole.OWNER,
        organization: { deletedAt: null },
      },
      select: {
        organization: {
          select: {
            plan: { select: { limits: true } },
          },
        },
      },
    });

    let maxOrgs = DEFAULT_LIMITS.maxOrgs;

    if (owned.length === 0) {
      const freePlan = await prisma.plan.findFirst({
        where: { slug: "free", isActive: true },
        select: { limits: true },
      });
      maxOrgs = parseLimits(freePlan?.limits).maxOrgs;
    } else {
      for (const row of owned) {
        const limits = parseLimits(row.organization.plan.limits);
        if (isUnlimited(limits.maxOrgs)) {
          return;
        }
        maxOrgs = Math.max(maxOrgs, limits.maxOrgs);
      }
    }

    if (isUnlimited(maxOrgs)) return;

    if (owned.length >= maxOrgs) {
      throw new PlanLimitError(
        "orgs",
        `Plan limit exceeded for orgs. Current: ${owned.length}, limit: ${maxOrgs}`,
      );
    }
  },

  async recordUsage(
    organizationId: string,
    metric: string,
    value: number,
  ): Promise<void> {
    const { periodStart, periodEnd } = getCurrentPeriod();

    const existing = await prisma.usageRecord.findFirst({
      where: {
        organizationId,
        metric,
        periodStart,
        periodEnd,
      },
    });

    if (existing) {
      await prisma.usageRecord.update({
        where: { id: existing.id },
        data: { value },
      });
    } else {
      await prisma.usageRecord.create({
        data: {
          organizationId,
          metric,
          value,
          periodStart,
          periodEnd,
        },
      });
    }
  },

  async syncUsageRecords(organizationId: string): Promise<void> {
    const metrics: LimitMetric[] = [
      "events",
      "guests",
      "storage",
      "messages",
      "collaborators",
    ];

    await Promise.all(
      metrics.map(async (metric) => {
        // Always compute live for sync (bypass usage-record short-circuit).
        let value = 0;
        switch (metric) {
          case "events":
            value = await prisma.event.count({
              where: { organizationId, deletedAt: null },
            });
            break;
          case "guests":
            value = await prisma.guest.count({
              where: {
                event: { organizationId, deletedAt: null },
                deletedAt: null,
              },
            });
            break;
          case "messages":
            value = await prisma.message.count({
              where: { event: { organizationId, deletedAt: null } },
            });
            break;
          case "storage":
            value = await prisma.media
              .aggregate({
                where: { event: { organizationId, deletedAt: null } },
                _sum: { fileSize: true },
              })
              .then((r) => Math.ceil((r._sum.fileSize ?? 0) / (1024 * 1024)));
            break;
          case "collaborators":
            value = await prisma.organizationMember.count({
              where: { organizationId },
            });
            break;
          default:
            break;
        }
        await this.recordUsage(organizationId, metric, value);
      }),
    );
  },
};
