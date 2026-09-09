import { AuditAction } from "@prisma/client";

import { exportsQueue } from "@/server/jobs/queues";
import { prisma } from "@/server/db";

import { auditService } from "./audit.service";

export class PrivacyServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "PrivacyServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const privacyService = {
  async requestDataExport(userId: string, ipAddress?: string): Promise<{ jobId: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new PrivacyServiceError("User not found", 404, "USER_NOT_FOUND");
    }

    const job = await exportsQueue.add("gdpr-export", {
      userId,
      type: "gdpr-export",
    });

    await auditService.logAudit({
      userId,
      action: AuditAction.USER_LOGIN,
      entity: "User",
      entityId: userId,
      metadata: { action: "gdpr_export_requested", jobId: job.id },
      ipAddress,
    });

    return { jobId: job.id ?? "queued" };
  },

  async requestAccountDeletion(userId: string, ipAddress?: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new PrivacyServiceError("User not found", 404, "USER_NOT_FOUND");
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        name: "[deleted]",
        email: `deleted-${userId}@deleted.local`,
        meindeskUserId: null,
        passwordHash: null,
        image: null,
        phone: null,
      },
    });

    await auditService.logAudit({
      userId,
      action: AuditAction.USER_REGISTER,
      entity: "User",
      entityId: userId,
      metadata: { action: "account_deletion_requested" },
      ipAddress,
    });
  },

  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        locale: true,
        createdAt: true,
        organizationMembers: {
          include: {
            organization: { select: { id: true, name: true, slug: true } },
          },
        },
        notifications: { take: 100, orderBy: { createdAt: "desc" } },
      },
    });

    if (!user) {
      throw new PrivacyServiceError("User not found", 404, "USER_NOT_FOUND");
    }

    return {
      exportedAt: new Date().toISOString(),
      user,
    };
  },
};
