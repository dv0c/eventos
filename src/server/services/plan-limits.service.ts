import { prisma } from "@/server/db";

export interface PlanLimits {
  maxEvents: number;
  maxGuests: number;
  maxStorage: number;
  maxCollaborators: number;
  maxMessages: number;
  maxWhatsAppMessages: number;
}

export type LimitMetric =
  | "events"
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
    maxGuests: Number(obj.maxGuests ?? DEFAULT_LIMITS.maxGuests),
    maxStorage: Number(obj.maxStorage ?? DEFAULT_LIMITS.maxStorage),
    maxCollaborators: Number(obj.maxCollaborators ?? DEFAULT_LIMITS.maxCollaborators),
    maxMessages: Number(obj.maxMessages ?? DEFAULT_LIMITS.maxMessages),
    maxWhatsAppMessages: Number(obj.maxWhatsAppMessages ?? DEFAULT_LIMITS.maxWhatsAppMessages),
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
    const { periodStart, periodEnd } = getCurrentPeriod();

    const usageRecord = await prisma.usageRecord.findFirst({
      where: {
        organizationId,
        metric,
        periodStart: { lte: periodStart },
        periodEnd: { gte: periodEnd },
      },
    });

    if (usageRecord) return usageRecord.value;

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
        return prisma.media.aggregate({
          where: { event: { organizationId, deletedAt: null } },
          _sum: { fileSize: true },
        }).then((r) => Math.ceil((r._sum.fileSize ?? 0) / (1024 * 1024)));
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
        const value = await this.getUsage(organizationId, metric);
        await this.recordUsage(organizationId, metric, value);
      }),
    );
  },
};
