import {
  InviteStatus,
  NotificationType,
  OrgRole,
  type Notification,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/server/db";

const EDIT_ROLES: OrgRole[] = [
  OrgRole.OWNER,
  OrgRole.ADMIN,
  OrgRole.MANAGER,
  OrgRole.EDITOR,
];

const MEDIA_PENDING_THROTTLE_MS = 60 * 60 * 1000;

export class NotificationServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "NotificationServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export type NotifyUserInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
  metadata?: Prisma.InputJsonValue;
  eventId?: string | null;
  organizationId?: string | null;
};

export const notificationService = {
  async notifyUser(input: NotifyUserInput): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
        metadata: input.metadata ?? undefined,
        eventId: input.eventId ?? null,
        organizationId: input.organizationId ?? null,
      },
    });
  },

  async notifyUsers(
    userIds: string[],
    input: Omit<NotifyUserInput, "userId">,
  ): Promise<number> {
    const unique = [...new Set(userIds.filter(Boolean))];
    if (unique.length === 0) return 0;

    await prisma.notification.createMany({
      data: unique.map((userId) => ({
        userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
        metadata: input.metadata ?? undefined,
        eventId: input.eventId ?? null,
        organizationId: input.organizationId ?? null,
      })),
    });
    return unique.length;
  },

  /**
   * Fan-out to org members with edit+ access and accepted event collaborators.
   * Optionally exclude a user (e.g. the actor).
   */
  async notifyEventStakeholders(
    eventId: string,
    input: Omit<NotifyUserInput, "userId" | "eventId" | "organizationId"> & {
      excludeUserId?: string;
    },
  ): Promise<number> {
    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: {
        id: true,
        organizationId: true,
        name: true,
        organization: { select: { slug: true } },
      },
    });
    if (!event) return 0;

    const [members, collaborators] = await Promise.all([
      prisma.organizationMember.findMany({
        where: {
          organizationId: event.organizationId,
          role: { in: EDIT_ROLES },
        },
        select: { userId: true },
      }),
      prisma.collaborator.findMany({
        where: { eventId },
        select: { userId: true },
      }),
    ]);

    const userIds = [
      ...members.map((m) => m.userId),
      ...collaborators.map((c) => c.userId),
    ].filter((id) => id !== input.excludeUserId);

    return this.notifyUsers(userIds, {
      ...input,
      eventId: event.id,
      organizationId: event.organizationId,
    });
  },

  /** Throttle MEDIA_PENDING: at most one unread per event per hour. */
  async notifyMediaPendingThrottled(
    eventId: string,
    input: Omit<NotifyUserInput, "userId" | "eventId" | "organizationId" | "type"> & {
      excludeUserId?: string;
    },
  ): Promise<number> {
    const since = new Date(Date.now() - MEDIA_PENDING_THROTTLE_MS);
    const recent = await prisma.notification.findFirst({
      where: {
        eventId,
        type: NotificationType.MEDIA_PENDING,
        createdAt: { gte: since },
      },
      select: { id: true },
    });
    if (recent) return 0;

    return this.notifyEventStakeholders(eventId, {
      ...input,
      type: NotificationType.MEDIA_PENDING,
    });
  },

  async listForUser(
    userId: string,
    opts: { limit?: number; cursor?: string } = {},
  ) {
    const limit = Math.min(Math.max(opts.limit ?? 30, 1), 100);
    const items = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(opts.cursor
        ? {
            cursor: { id: opts.cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    return {
      items: page,
      unreadCount,
      nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    };
  },

  async unreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, read: false } });
  },

  async markRead(userId: string, ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await prisma.notification.updateMany({
      where: { userId, id: { in: ids }, read: false },
      data: { read: true },
    });
    return result.count;
  },

  async markAllRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return result.count;
  },

  async respondToCollabInvite(
    userId: string,
    userEmail: string,
    notificationId: string,
    action: "accept" | "decline",
  ) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw new NotificationServiceError(
        "Notification not found",
        404,
        "NOTIFICATION_NOT_FOUND",
      );
    }
    if (notification.type !== NotificationType.COLLAB_INVITE) {
      throw new NotificationServiceError(
        "Not a collaboration invite",
        400,
        "INVALID_NOTIFICATION_TYPE",
      );
    }

    const meta = (notification.metadata ?? {}) as {
      collaboratorId?: string;
      eventId?: string;
      role?: string;
    };
    const eventId = meta.eventId ?? notification.eventId;
    const collaboratorId = meta.collaboratorId;
    if (!eventId || !collaboratorId) {
      throw new NotificationServiceError(
        "Invite metadata incomplete",
        400,
        "INVALID_METADATA",
      );
    }

    const email = userEmail.toLowerCase();
    const invite = await prisma.eventCollaborator.findFirst({
      where: { id: collaboratorId, eventId },
    });
    if (!invite || invite.email.toLowerCase() !== email) {
      throw new NotificationServiceError(
        "Invite not found",
        404,
        "INVITE_NOT_FOUND",
      );
    }
    if (invite.status !== InviteStatus.PENDING) {
      await this.markRead(userId, [notificationId]);
      return { status: invite.status, eventId };
    }

    if (action === "decline") {
      await prisma.eventCollaborator.update({
        where: { id: invite.id },
        data: { status: InviteStatus.REVOKED, userId },
      });
      await this.markRead(userId, [notificationId]);
      return { status: InviteStatus.REVOKED, eventId };
    }

    const orgRole = invite.role === "VIEWER" ? OrgRole.VIEWER : OrgRole.EDITOR;

    await prisma.$transaction([
      prisma.eventCollaborator.update({
        where: { id: invite.id },
        data: {
          status: InviteStatus.ACCEPTED,
          userId,
        },
      }),
      prisma.collaborator.upsert({
        where: { eventId_userId: { eventId, userId } },
        create: { eventId, userId, role: orgRole },
        update: { role: orgRole },
      }),
    ]);

    await this.markRead(userId, [notificationId]);

    const event = await prisma.event.findFirst({
      where: { id: eventId },
      select: {
        name: true,
        organizationId: true,
        organization: { select: { slug: true } },
      },
    });

    if (event) {
      await this.notifyEventStakeholders(eventId, {
        type: NotificationType.COLLABORATOR_JOINED,
        title: "Collaborator joined",
        body: `${userEmail} joined ${event.name}`,
        link: `/org/${event.organization.slug}/events/${eventId}/collaborators`,
        excludeUserId: userId,
        metadata: { email: userEmail },
      });
    }

    return { status: InviteStatus.ACCEPTED, eventId };
  },
};
