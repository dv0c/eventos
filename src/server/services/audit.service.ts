import type { AuditAction, AuditLog, Prisma } from "@prisma/client";

import { prisma } from "@/server/db";

export interface LogAuditInput {
  userId?: string | null;
  organizationId?: string | null;
  eventId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}

export const auditService = {
  async logAudit(input: LogAuditInput): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        organizationId: input.organizationId ?? null,
        eventId: input.eventId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? undefined,
        ipAddress: input.ipAddress ?? null,
      },
    });
  },
};
