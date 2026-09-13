import {
  AuditAction,
  EventStatus,
  Locale,
  MediaStatus,
  OrgMode,
  OrgRole,
  PlatformRole,
  Prisma,
  SubscriptionStatus,
  type EventType,
} from "@prisma/client";

import { prisma } from "@/server/db";
import { getStorageProvider } from "@/server/providers/storage";
import { auditService } from "@/server/services/audit.service";

export class AdminServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode = 400, code = "ADMIN_ERROR") {
    super(message);
    this.name = "AdminServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const adminService = {
  // ── Overview / analytics ──────────────────────────────────────────────

  async getOverview() {
    const since = daysAgo(30);

    const [
      users,
      organizations,
      events,
      mediaPending,
      mediaApproved,
      subscriptionsActive,
      mediaBytes,
      recentAudit,
      signups,
      eventsCreated,
      mediaUploads,
      subscriptionGroups,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.organization.count({ where: { deletedAt: null } }),
      prisma.event.count({ where: { deletedAt: null } }),
      prisma.media.count({ where: { status: MediaStatus.PENDING } }),
      prisma.media.count({ where: { status: MediaStatus.APPROVED } }),
      prisma.subscription.count({
        where: {
          status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
        },
      }),
      prisma.media.aggregate({ _sum: { fileSize: true } }),
      prisma.auditLog.findMany({
        take: 12,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      prisma.event.findMany({
        where: { createdAt: { gte: since }, deletedAt: null },
        select: { createdAt: true },
      }),
      prisma.media.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      prisma.subscription.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const series = (rows: { createdAt: Date }[]) => {
      const map = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        map.set(dateKey(daysAgo(i)), 0);
      }
      for (const row of rows) {
        const key = dateKey(row.createdAt);
        if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
      }
      return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
    };

    return {
      summary: {
        users,
        organizations,
        events,
        mediaPending,
        mediaApproved,
        subscriptionsActive,
        storageBytes: mediaBytes._sum.fileSize ?? 0,
      },
      charts: {
        signups: series(signups),
        eventsCreated: series(eventsCreated),
        mediaUploads: series(mediaUploads),
        subscriptionsByStatus: subscriptionGroups.map((g) => ({
          status: g.status,
          count: g._count._all,
        })),
      },
      recentAudit,
    };
  },

  // ── Users ─────────────────────────────────────────────────────────────

  async listUsers(params: {
    search?: string;
    role?: PlatformRole;
    includeDeleted?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 25;
    const where: Prisma.UserWhereInput = {
      ...(params.includeDeleted ? {} : { deletedAt: null }),
      ...(params.role ? { platformRole: params.role } : {}),
      ...(params.search
        ? {
            OR: [
              { email: { contains: params.search, mode: "insensitive" } },
              { name: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          locale: true,
          platformRole: true,
          image: true,
          deletedAt: true,
          createdAt: true,
          _count: { select: { organizationMembers: true } },
        },
      }),
    ]);

    return { items, total, page, pageSize };
  },

  async getUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizationMembers: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                mode: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });
    if (!user) throw new AdminServiceError("User not found", 404, "NOT_FOUND");

    const recentAudit = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return { user, recentAudit };
  },

  async updateUser(
    actorId: string,
    userId: string,
    data: {
      name?: string | null;
      email?: string;
      phone?: string | null;
      locale?: Locale;
      platformRole?: PlatformRole;
    },
    ipAddress?: string,
  ) {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new AdminServiceError("User not found", 404, "NOT_FOUND");

    if (
      data.platformRole &&
      data.platformRole !== PlatformRole.ADMIN &&
      existing.platformRole === PlatformRole.ADMIN
    ) {
      const adminCount = await prisma.user.count({
        where: { platformRole: PlatformRole.ADMIN, deletedAt: null },
      });
      if (adminCount <= 1) {
        throw new AdminServiceError(
          "Cannot demote the last platform admin",
          400,
          "LAST_ADMIN",
        );
      }
    }

    if (data.email && data.email !== existing.email) {
      const clash = await prisma.user.findFirst({
        where: { email: data.email, NOT: { id: userId } },
      });
      if (clash) {
        throw new AdminServiceError("Email already in use", 409, "EMAIL_TAKEN");
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.locale !== undefined ? { locale: data.locale } : {}),
        ...(data.platformRole !== undefined
          ? { platformRole: data.platformRole }
          : {}),
      },
    });

    await auditService.logAudit({
      userId: actorId,
      action: AuditAction.PERMISSION_CHANGED,
      entity: "User",
      entityId: userId,
      metadata: { patch: data },
      ipAddress,
    });

    return updated;
  },

  async softDeleteUser(actorId: string, userId: string, ipAddress?: string) {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new AdminServiceError("User not found", 404, "NOT_FOUND");
    if (existing.platformRole === PlatformRole.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { platformRole: PlatformRole.ADMIN, deletedAt: null },
      });
      if (adminCount <= 1) {
        throw new AdminServiceError(
          "Cannot delete the last platform admin",
          400,
          "LAST_ADMIN",
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    await auditService.logAudit({
      userId: actorId,
      action: AuditAction.PERMISSION_CHANGED,
      entity: "User",
      entityId: userId,
      metadata: { softDelete: true },
      ipAddress,
    });

    return updated;
  },

  async restoreUser(actorId: string, userId: string, ipAddress?: string) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: null },
    });
    await auditService.logAudit({
      userId: actorId,
      action: AuditAction.PERMISSION_CHANGED,
      entity: "User",
      entityId: userId,
      metadata: { restore: true },
      ipAddress,
    });
    return updated;
  },

  // ── Organizations ─────────────────────────────────────────────────────

  async listOrganizations(params: {
    search?: string;
    includeDeleted?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 25;
    const where: Prisma.OrganizationWhereInput = {
      ...(params.includeDeleted ? {} : { deletedAt: null }),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { slug: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.organization.count({ where }),
      prisma.organization.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          plan: { select: { id: true, name: true, slug: true } },
          _count: { select: { members: true, events: true } },
        },
      }),
    ]);

    return { items, total, page, pageSize };
  },

  async getOrganization(organizationId: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        plan: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                platformRole: true,
                deletedAt: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { plan: { select: { name: true, slug: true } } },
        },
        events: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            type: true,
            date: true,
          },
        },
      },
    });
    if (!organization) {
      throw new AdminServiceError("Organization not found", 404, "NOT_FOUND");
    }
    return organization;
  },

  async updateOrganization(
    actorId: string,
    organizationId: string,
    data: {
      name?: string;
      slug?: string;
      mode?: OrgMode;
      brandName?: string | null;
      logoUrl?: string | null;
      primaryColor?: string | null;
      secondaryColor?: string | null;
      customDomain?: string | null;
      planId?: string;
    },
    ipAddress?: string,
  ) {
    if (data.slug) {
      const clash = await prisma.organization.findFirst({
        where: { slug: data.slug, NOT: { id: organizationId } },
      });
      if (clash) {
        throw new AdminServiceError("Slug already in use", 409, "SLUG_TAKEN");
      }
    }
    if (data.planId) {
      const plan = await prisma.plan.findUnique({ where: { id: data.planId } });
      if (!plan) throw new AdminServiceError("Plan not found", 404, "PLAN_NOT_FOUND");
    }

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.mode !== undefined ? { mode: data.mode } : {}),
        ...(data.brandName !== undefined ? { brandName: data.brandName } : {}),
        ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
        ...(data.primaryColor !== undefined
          ? { primaryColor: data.primaryColor }
          : {}),
        ...(data.secondaryColor !== undefined
          ? { secondaryColor: data.secondaryColor }
          : {}),
        ...(data.customDomain !== undefined
          ? { customDomain: data.customDomain }
          : {}),
        ...(data.planId !== undefined ? { planId: data.planId } : {}),
      },
      include: { plan: true },
    });

    await auditService.logAudit({
      userId: actorId,
      organizationId,
      action: AuditAction.ORG_UPDATED,
      entity: "Organization",
      entityId: organizationId,
      metadata: { patch: data },
      ipAddress,
    });

    return updated;
  },

  async softDeleteOrganization(
    actorId: string,
    organizationId: string,
    ipAddress?: string,
  ) {
    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: { deletedAt: new Date() },
    });
    await auditService.logAudit({
      userId: actorId,
      organizationId,
      action: AuditAction.ORG_UPDATED,
      entity: "Organization",
      entityId: organizationId,
      metadata: { softDelete: true },
      ipAddress,
    });
    return updated;
  },

  async restoreOrganization(
    actorId: string,
    organizationId: string,
    ipAddress?: string,
  ) {
    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: { deletedAt: null },
    });
    await auditService.logAudit({
      userId: actorId,
      organizationId,
      action: AuditAction.ORG_UPDATED,
      entity: "Organization",
      entityId: organizationId,
      metadata: { restore: true },
      ipAddress,
    });
    return updated;
  },

  async updateMemberRole(
    actorId: string,
    organizationId: string,
    memberId: string,
    role: OrgRole,
    ipAddress?: string,
  ) {
    const member = await prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId },
    });
    if (!member) throw new AdminServiceError("Member not found", 404, "NOT_FOUND");

    const updated = await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role },
    });

    await auditService.logAudit({
      userId: actorId,
      organizationId,
      action: AuditAction.PERMISSION_CHANGED,
      entity: "OrganizationMember",
      entityId: memberId,
      metadata: { role },
      ipAddress,
    });

    return updated;
  },

  async removeMember(
    actorId: string,
    organizationId: string,
    memberId: string,
    ipAddress?: string,
  ) {
    const member = await prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId },
    });
    if (!member) throw new AdminServiceError("Member not found", 404, "NOT_FOUND");

    await prisma.organizationMember.delete({ where: { id: memberId } });

    await auditService.logAudit({
      userId: actorId,
      organizationId,
      action: AuditAction.PERMISSION_CHANGED,
      entity: "OrganizationMember",
      entityId: memberId,
      metadata: { removed: true, userId: member.userId },
      ipAddress,
    });
  },

  // ── Events ────────────────────────────────────────────────────────────

  async listEvents(params: {
    search?: string;
    status?: EventStatus;
    organizationId?: string;
    includeDeleted?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 25;
    const where: Prisma.EventWhereInput = {
      ...(params.includeDeleted ? {} : { deletedAt: null }),
      ...(params.status ? { status: params.status } : {}),
      ...(params.organizationId
        ? { organizationId: params.organizationId }
        : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { slug: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          organization: { select: { id: true, name: true, slug: true } },
          _count: { select: { media: true } },
        },
      }),
    ]);

    return { items, total, page, pageSize };
  },

  async getEvent(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        settings: true,
        theme: true,
        _count: {
          select: {
            media: true,
            guests: true,
            songRequests: true,
            voiceWishes: true,
          },
        },
      },
    });
    if (!event) throw new AdminServiceError("Event not found", 404, "NOT_FOUND");
    return event;
  },

  async updateEvent(
    actorId: string,
    eventId: string,
    data: {
      name?: string;
      status?: EventStatus;
      type?: EventType;
      description?: string | null;
      date?: Date;
      endDate?: Date;
      startTime?: string;
      endTime?: string;
      location?: string | null;
      address?: string | null;
      hostName?: string | null;
      hostEmail?: string | null;
      hostPhone?: string | null;
    },
    ipAddress?: string,
  ) {
    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) throw new AdminServiceError("Event not found", 404, "NOT_FOUND");

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.date !== undefined ? { date: data.date } : {}),
        ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
        ...(data.startTime !== undefined ? { startTime: data.startTime } : {}),
        ...(data.endTime !== undefined ? { endTime: data.endTime } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.hostName !== undefined ? { hostName: data.hostName } : {}),
        ...(data.hostEmail !== undefined ? { hostEmail: data.hostEmail } : {}),
        ...(data.hostPhone !== undefined ? { hostPhone: data.hostPhone } : {}),
      },
    });

    await auditService.logAudit({
      userId: actorId,
      organizationId: existing.organizationId,
      eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "Event",
      entityId: eventId,
      metadata: { patch: data },
      ipAddress,
    });

    return updated;
  },

  async updateEventSettings(
    actorId: string,
    eventId: string,
    data: Partial<{
      isPublic: boolean;
      enableGallery: boolean;
      enableWall: boolean;
      enableVoiceWishes: boolean;
      enableSongRequests: boolean;
      requireManualApproval: boolean;
    }>,
    ipAddress?: string,
  ) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new AdminServiceError("Event not found", 404, "NOT_FOUND");

    const updated = await prisma.eventSettings.upsert({
      where: { eventId },
      create: { eventId, ...data },
      update: data,
    });

    await auditService.logAudit({
      userId: actorId,
      organizationId: event.organizationId,
      eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "EventSettings",
      entityId: eventId,
      metadata: { patch: data },
      ipAddress,
    });

    return updated;
  },

  async updateEventTheme(
    actorId: string,
    eventId: string,
    data: Partial<{
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      logoUrl: string | null;
      albumBackgroundUrl: string | null;
    }>,
    ipAddress?: string,
  ) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new AdminServiceError("Event not found", 404, "NOT_FOUND");

    const updated = await prisma.eventTheme.upsert({
      where: { eventId },
      create: {
        eventId,
        primaryColor: data.primaryColor ?? "#C4A574",
        secondaryColor: data.secondaryColor ?? "#F59E0B",
        accentColor: data.accentColor ?? "#E8C9A0",
        logoUrl: data.logoUrl ?? null,
        albumBackgroundUrl: data.albumBackgroundUrl ?? null,
      },
      update: data,
    });

    await auditService.logAudit({
      userId: actorId,
      organizationId: event.organizationId,
      eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "EventTheme",
      entityId: eventId,
      metadata: { patch: data },
      ipAddress,
    });

    return updated;
  },

  async softDeleteEvent(actorId: string, eventId: string, ipAddress?: string) {
    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) throw new AdminServiceError("Event not found", 404, "NOT_FOUND");

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { deletedAt: new Date() },
    });

    await auditService.logAudit({
      userId: actorId,
      organizationId: existing.organizationId,
      eventId,
      action: AuditAction.EVENT_DELETED,
      entity: "Event",
      entityId: eventId,
      metadata: { softDelete: true },
      ipAddress,
    });

    return updated;
  },

  async restoreEvent(actorId: string, eventId: string, ipAddress?: string) {
    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) throw new AdminServiceError("Event not found", 404, "NOT_FOUND");

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { deletedAt: null },
    });

    await auditService.logAudit({
      userId: actorId,
      organizationId: existing.organizationId,
      eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "Event",
      entityId: eventId,
      metadata: { restore: true },
      ipAddress,
    });

    return updated;
  },

  // ── Media ─────────────────────────────────────────────────────────────

  async listMedia(params: {
    status?: MediaStatus;
    eventId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 24;
    const where: Prisma.MediaWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.eventId ? { eventId: params.eventId } : {}),
      ...(params.search
        ? {
            OR: [
              { fileName: { contains: params.search, mode: "insensitive" } },
              { uploadedBy: { contains: params.search, mode: "insensitive" } },
              { caption: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const storage = getStorageProvider();
    const [total, items] = await Promise.all([
      prisma.media.count({ where }),
      prisma.media.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              organization: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        url: storage.getPublicUrl(item.storageKey),
      })),
      total,
      page,
      pageSize,
    };
  },

  async moderateMedia(
    actorId: string,
    mediaId: string,
    action: "approve" | "reject" | "feature",
    ipAddress?: string,
  ) {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) throw new AdminServiceError("Media not found", 404, "NOT_FOUND");

    const statusMap = {
      approve: MediaStatus.APPROVED,
      reject: MediaStatus.REJECTED,
      feature: MediaStatus.FEATURED,
    } as const;

    const updated = await prisma.media.update({
      where: { id: mediaId },
      data: {
        status: statusMap[action],
        isFeatured: action === "feature",
      },
    });

    await prisma.mediaModeration.create({
      data: {
        mediaId,
        action,
        moderatedBy: actorId,
      },
    });

    const event = await prisma.event.findUnique({
      where: { id: media.eventId },
      select: { organizationId: true },
    });

    await auditService.logAudit({
      userId: actorId,
      organizationId: event?.organizationId,
      eventId: media.eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "Media",
      entityId: mediaId,
      metadata: { action, admin: true },
      ipAddress,
    });

    const storage = getStorageProvider();
    return { ...updated, url: storage.getPublicUrl(updated.storageKey) };
  },

  async deleteMedia(actorId: string, mediaId: string, ipAddress?: string) {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) throw new AdminServiceError("Media not found", 404, "NOT_FOUND");

    const event = await prisma.event.findUnique({
      where: { id: media.eventId },
      select: { organizationId: true },
    });

    const storage = getStorageProvider();
    try {
      await storage.delete(media.storageKey);
    } catch {
      // continue DB delete even if object missing
    }

    await prisma.media.delete({ where: { id: mediaId } });

    await auditService.logAudit({
      userId: actorId,
      organizationId: event?.organizationId,
      eventId: media.eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "Media",
      entityId: mediaId,
      metadata: { deleted: true, admin: true },
      ipAddress,
    });
  },

  async listVoiceWishes(params: { page?: number; pageSize?: number }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 24;
    const storage = getStorageProvider();
    const [total, items] = await Promise.all([
      prisma.voiceWish.count(),
      prisma.voiceWish.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          event: {
            select: {
              id: true,
              name: true,
              organization: { select: { name: true, slug: true } },
            },
          },
        },
      }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        url: storage.getPublicUrl(item.storageKey),
      })),
      total,
      page,
      pageSize,
    };
  },

  async deleteVoiceWish(actorId: string, wishId: string, ipAddress?: string) {
    const wish = await prisma.voiceWish.findUnique({ where: { id: wishId } });
    if (!wish) throw new AdminServiceError("Voice wish not found", 404, "NOT_FOUND");

    const event = await prisma.event.findUnique({
      where: { id: wish.eventId },
      select: { organizationId: true },
    });

    const storage = getStorageProvider();
    try {
      await storage.delete(wish.storageKey);
    } catch {
      // ignore
    }

    await prisma.voiceWish.delete({ where: { id: wishId } });

    await auditService.logAudit({
      userId: actorId,
      organizationId: event?.organizationId,
      eventId: wish.eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "VoiceWish",
      entityId: wishId,
      metadata: { deleted: true, admin: true },
      ipAddress,
    });
  },

  // ── Billing ───────────────────────────────────────────────────────────

  async listPlans() {
    return prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  },

  async updatePlan(
    actorId: string,
    planId: string,
    data: Partial<{
      name: string;
      description: string | null;
      priceMonthly: number;
      priceYearly: number;
      limits: Prisma.InputJsonValue;
      features: Prisma.InputJsonValue;
      isActive: boolean;
      stripePriceIdMonthly: string | null;
      stripePriceIdYearly: string | null;
      sortOrder: number;
    }>,
    ipAddress?: string,
  ) {
    const updated = await prisma.plan.update({
      where: { id: planId },
      data,
    });

    await auditService.logAudit({
      userId: actorId,
      action: AuditAction.SUBSCRIPTION_CHANGED,
      entity: "Plan",
      entityId: planId,
      metadata: { patch: data },
      ipAddress,
    });

    return updated;
  },

  async listSubscriptions(params: { page?: number; pageSize?: number }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 25;
    const [total, items] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          plan: { select: { id: true, name: true, slug: true } },
          organization: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);
    return { items, total, page, pageSize };
  },

  async listInvoices(params: { page?: number; pageSize?: number }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 25;
    const [total, items] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          subscription: {
            include: {
              organization: { select: { id: true, name: true, slug: true } },
              plan: { select: { name: true } },
            },
          },
        },
      }),
    ]);
    return { items, total, page, pageSize };
  },

  async updateSubscription(
    actorId: string,
    subscriptionId: string,
    data: Partial<{
      status: SubscriptionStatus;
      cancelAtPeriodEnd: boolean;
      planId: string;
    }>,
    ipAddress?: string,
  ) {
    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data,
      include: {
        plan: true,
        organization: { select: { id: true, name: true } },
      },
    });

    await auditService.logAudit({
      userId: actorId,
      organizationId: updated.organizationId,
      action: AuditAction.SUBSCRIPTION_CHANGED,
      entity: "Subscription",
      entityId: subscriptionId,
      metadata: { patch: data },
      ipAddress,
    });

    return updated;
  },

  // ── Audit ─────────────────────────────────────────────────────────────

  async listAuditLogs(params: {
    action?: AuditAction;
    search?: string;
    organizationId?: string;
    from?: Date;
    to?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 40;
    const where: Prisma.AuditLogWhereInput = {
      ...(params.action ? { action: params.action } : {}),
      ...(params.organizationId
        ? { organizationId: params.organizationId }
        : {}),
      ...(params.from || params.to
        ? {
            createdAt: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
      ...(params.search
        ? {
            OR: [
              { entity: { contains: params.search, mode: "insensitive" } },
              { entityId: { contains: params.search, mode: "insensitive" } },
              {
                user: {
                  OR: [
                    { email: { contains: params.search, mode: "insensitive" } },
                    { name: { contains: params.search, mode: "insensitive" } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      }),
    ]);

    return { items, total, page, pageSize };
  },
};
