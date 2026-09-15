import { EventStatus } from "@prisma/client";

import { prisma } from "@/server/db";
import {
  canPauseEvent,
  canResumeEvent,
  canStartEvent,
  canStopEvent,
  getEventRunPhase,
  getLiveDeadlineAt,
  getRestartDeadlineAt,
  LIVE_WINDOW_DAYS,
  RESTART_GRACE_DAYS,
  type EventRunPhase,
} from "@/server/events/event-ended";
import { revokeGuestConnectIfEnded } from "@/server/events/revoke-guest-connect";
import { enforceEventAccess } from "@/server/permissions/enforce";
import { auditService } from "@/server/services/audit.service";

export type EventRunAction = "start" | "pause" | "resume" | "stop";

export class EventRunServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = "RUN_ERROR",
  ) {
    super(message);
    this.name = "EventRunServiceError";
  }
}

const RUN_SELECT = {
  id: true,
  organizationId: true,
  status: true,
  liveStartedAt: true,
  pausedAt: true,
  stoppedAt: true,
  lockedAt: true,
  date: true,
  endDate: true,
  startTime: true,
  endTime: true,
} as const;

export type EventRunSnapshot = {
  phase: EventRunPhase;
  liveStartedAt: string | null;
  pausedAt: string | null;
  stoppedAt: string | null;
  lockedAt: string | null;
  liveDeadlineAt: string | null;
  restartDeadlineAt: string | null;
  canStart: boolean;
  canPause: boolean;
  canResume: boolean;
  canStop: boolean;
  liveWindowDays: number;
  restartGraceDays: number;
};

function toSnapshot(event: {
  status: EventStatus;
  liveStartedAt: Date | null;
  pausedAt: Date | null;
  stoppedAt: Date | null;
  lockedAt: Date | null;
}): EventRunSnapshot {
  const phase = getEventRunPhase(event);
  const liveDeadline = getLiveDeadlineAt(event);
  const restartDeadline = getRestartDeadlineAt(event);
  return {
    phase,
    liveStartedAt: event.liveStartedAt?.toISOString() ?? null,
    pausedAt: event.pausedAt?.toISOString() ?? null,
    stoppedAt: event.stoppedAt?.toISOString() ?? null,
    lockedAt: event.lockedAt?.toISOString() ?? null,
    liveDeadlineAt: liveDeadline?.toISOString() ?? null,
    restartDeadlineAt: restartDeadline?.toISOString() ?? null,
    canStart: canStartEvent(event),
    canPause: canPauseEvent(event),
    canResume: canResumeEvent(event),
    canStop: canStopEvent(event),
    liveWindowDays: LIVE_WINDOW_DAYS,
    restartGraceDays: RESTART_GRACE_DAYS,
  };
}

export const eventRunService = {
  async getSnapshot(userId: string, eventId: string): Promise<EventRunSnapshot> {
    await enforceEventAccess(userId, eventId, "event:read");
    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: RUN_SELECT,
    });
    if (!event) {
      throw new EventRunServiceError("Event not found", 404, "NOT_FOUND");
    }
    return toSnapshot(event);
  },

  async runAction(
    userId: string,
    eventId: string,
    action: EventRunAction,
  ): Promise<EventRunSnapshot> {
    await enforceEventAccess(userId, eventId, "event:update");

    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: RUN_SELECT,
    });
    if (!event) {
      throw new EventRunServiceError("Event not found", 404, "NOT_FOUND");
    }

    const now = new Date();

    if (action === "start") {
      if (!canStartEvent(event, now)) {
        throw new EventRunServiceError(
          "Event cannot be started",
          400,
          "CANNOT_START",
        );
      }
      const updated = await prisma.event.update({
        where: { id: eventId },
        data: {
          liveStartedAt: now,
          pausedAt: null,
          stoppedAt: null,
          lockedAt: null,
          status: EventStatus.ACTIVE,
        },
        select: RUN_SELECT,
      });
      await auditService.logAudit({
        organizationId: event.organizationId,
        userId,
        eventId,
        action: "EVENT_UPDATED",
        entity: "Event",
        entityId: eventId,
        metadata: { runAction: "start" },
      });
      return toSnapshot(updated);
    }

    if (action === "pause") {
      if (!canPauseEvent(event, now)) {
        throw new EventRunServiceError(
          "Event cannot be paused",
          400,
          "CANNOT_PAUSE",
        );
      }
      const updated = await prisma.event.update({
        where: { id: eventId },
        data: { pausedAt: now },
        select: RUN_SELECT,
      });
      await auditService.logAudit({
        organizationId: event.organizationId,
        userId,
        eventId,
        action: "EVENT_UPDATED",
        entity: "Event",
        entityId: eventId,
        metadata: { runAction: "pause" },
      });
      return toSnapshot(updated);
    }

    if (action === "resume") {
      if (!canResumeEvent(event, now)) {
        throw new EventRunServiceError(
          "Event cannot be resumed",
          400,
          "CANNOT_RESUME",
        );
      }
      const updated = await prisma.event.update({
        where: { id: eventId },
        data: { pausedAt: null },
        select: RUN_SELECT,
      });
      await auditService.logAudit({
        organizationId: event.organizationId,
        userId,
        eventId,
        action: "EVENT_UPDATED",
        entity: "Event",
        entityId: eventId,
        metadata: { runAction: "resume" },
      });
      return toSnapshot(updated);
    }

    // stop
    if (!canStopEvent(event, now)) {
      throw new EventRunServiceError(
        "Event cannot be stopped",
        400,
        "CANNOT_STOP",
      );
    }
    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        pausedAt: null,
        stoppedAt: now,
        lockedAt: now,
        status: EventStatus.COMPLETED,
      },
      select: RUN_SELECT,
    });
    await revokeGuestConnectIfEnded(eventId);
    await auditService.logAudit({
      organizationId: event.organizationId,
      userId,
      eventId,
      action: "EVENT_UPDATED",
      entity: "Event",
      entityId: eventId,
      metadata: { runAction: "stop" },
    });

    {
      const {
        enqueueNotification,
        eventOverviewLink,
        NotificationType,
        notificationService,
      } = await import("@/server/notifications/emit");
      enqueueNotification(async () => {
        const full = await prisma.event.findFirst({
          where: { id: eventId },
          select: {
            name: true,
            organization: { select: { slug: true } },
          },
        });
        if (!full) return;
        await notificationService.notifyEventStakeholders(eventId, {
          type: NotificationType.EVENT_STOPPED,
          title: "Event stopped",
          body: full.name,
          link: eventOverviewLink(full.organization.slug, eventId),
          excludeUserId: userId,
        });
      });
    }

    return toSnapshot(updated);
  },
};
