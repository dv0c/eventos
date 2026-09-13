import {
  AuditAction,
  EventStatus,
  EventType,
  Prisma,
  QRCodeType,
} from "@prisma/client";

import { generateUniqueEventSlug } from "@/lib/slug";
import { DEFAULT_EVENT_SETTINGS } from "@/server/events/default-settings";
import { getEventEndAt, getEventStartAt } from "@/server/events/event-ended";
import { prisma } from "@/server/db";
import { enforceEventAccess, enforceOrganizationAccess } from "@/server/permissions/enforce";
import {
  eventRepository,
  type EventOverviewStats,
  type EventWithRelations,
} from "@/server/repositories/event.repository";

import { auditService } from "./audit.service";
import { mediaService } from "./media.service";
import type { EventTimeframe } from "@/server/repositories/event.repository";
import { planLimitsService } from "./plan-limits.service";
import { seedDefaultGamesForEvent } from "@/server/events/event-games";

export interface CreateEventWizardInput {
  organizationId: string;
  name: string;
  type?: EventType;
  description?: string;
  date: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  clientId?: string;
  expectedGuests?: number;
  expectedCouples?: number;
  expectedChildren?: number;
  expectedVip?: number;
  settings?: Prisma.EventSettingsCreateWithoutEventInput;
  theme?: Prisma.EventThemeCreateWithoutEventInput;
  games?: Array<{
    title: string;
    description?: string | null;
    presetKey?: string | null;
    mode?: "photo" | "collage";
    sortOrder?: number;
    enabled?: boolean;
    fields?: unknown;
    coverImage?: string | null;
  }>;
}

export interface ListEventsInput {
  organizationId: string;
  status?: EventStatus;
  type?: EventType;
  clientId?: string;
  timeframe?: EventTimeframe;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListEventsResult {
  events: EventWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class EventServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "EventServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function assertValidSchedule(input: {
  date: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
}) {
  const startAt = getEventStartAt({ date: input.date, startTime: input.startTime });
  const endAt = getEventEndAt({
    date: input.date,
    endDate: input.endDate,
    endTime: input.endTime,
  });
  if (endAt.getTime() <= startAt.getTime()) {
    throw new EventServiceError(
      "Event end must be after start",
      400,
      "INVALID_SCHEDULE",
    );
  }
}

export const eventService = {
  async createEvent(
    userId: string,
    input: CreateEventWizardInput,
    ipAddress?: string,
  ): Promise<EventWithRelations> {
    await enforceOrganizationAccess(userId, input.organizationId, "event:create");
    await planLimitsService.assertEventCreateAllowed(userId, input.organizationId);
    assertValidSchedule(input);

    const slug = await generateUniqueEventSlug(input.name, (candidate) =>
      eventRepository.slugExists(candidate),
    );

    let eventId: string | null = null;

    try {
      const event = await eventRepository.create({
        organizationId: input.organizationId,
        name: input.name.trim(),
        slug,
        type: input.type ?? EventType.OTHER,
        status: EventStatus.DRAFT,
        description: input.description ?? null,
        date: input.date,
        endDate: input.endDate,
        startTime: input.startTime,
        endTime: input.endTime,
        clientId: input.clientId ?? null,
        expectedGuests: input.expectedGuests ?? 0,
        expectedCouples: input.expectedCouples ?? 0,
        expectedChildren: input.expectedChildren ?? 0,
        expectedVip: input.expectedVip ?? 0,
        settings: { ...DEFAULT_EVENT_SETTINGS, ...input.settings },
        theme: input.theme,
      });
      eventId = event.id;

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const publicBase = `${baseUrl}/el/e/${event.slug}`;
      // Token must be creatable before the event starts (QR codes for sharing).
      const albumToken = await mediaService.getUploadTokenForEvent(event.id);

      const moderationUrl = `${baseUrl}/el/mod/${event.id}`;

      await prisma.qRCode.createMany({
        data: [
          { eventId: event.id, type: QRCodeType.EVENT, url: publicBase },
          { eventId: event.id, type: QRCodeType.RSVP, url: `${publicBase}?rsvp=1` },
          { eventId: event.id, type: QRCodeType.UPLOAD, url: `${baseUrl}/el/a/${albumToken}` },
          { eventId: event.id, type: QRCodeType.WALL, url: `${publicBase}/wall` },
          { eventId: event.id, type: QRCodeType.MODERATION, url: moderationUrl },
          { eventId: event.id, type: QRCodeType.DJ, url: `${baseUrl}/el/mod/${event.id}/dj` },
        ],
      });

      if (input.games && input.games.length > 0) {
        await prisma.eventGame.createMany({
          data: input.games.map((game, index) => ({
            eventId: event.id,
            title: game.title,
            description: game.description ?? null,
            presetKey: game.presetKey ?? null,
            mode: game.mode === "collage" || game.presetKey === "collage" ? "collage" : "photo",
            sortOrder: game.sortOrder ?? index,
            enabled: game.enabled ?? true,
            fields: (game.fields ?? []) as Prisma.InputJsonValue,
            coverImage: game.coverImage ?? null,
          })),
        });
      } else {
        await seedDefaultGamesForEvent(event.id, event.type);
      }

      await auditService.logAudit({
        userId,
        organizationId: input.organizationId,
        eventId: event.id,
        action: AuditAction.EVENT_CREATED,
        entity: "Event",
        entityId: event.id,
        metadata: {
          name: event.name,
          slug: event.slug,
          type: event.type,
        },
        ipAddress,
      });

      return event;
    } catch (error) {
      if (eventId) {
        await prisma.event
          .update({
            where: { id: eventId },
            data: { deletedAt: new Date() },
          })
          .catch(() => undefined);
      }
      throw error;
    }
  },

  async getEventOverview(
    userId: string,
    eventId: string,
  ): Promise<{ event: EventWithRelations; stats: EventOverviewStats }> {
    const access = await enforceEventAccess(userId, eventId, "event:read");

    const event = await eventRepository.findById(access.organizationId, eventId);

    if (!event) {
      throw new EventServiceError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    const stats = await eventRepository.getOverviewStats(eventId);

    if (!stats) {
      throw new EventServiceError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    return { event, stats };
  },

  async listEvents(
    userId: string,
    input: ListEventsInput,
  ): Promise<ListEventsResult> {
    await enforceOrganizationAccess(userId, input.organizationId, "event:read");

    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));

    const { events, total } = await eventRepository.listByOrg(input.organizationId, {
      status: input.status,
      type: input.type,
      clientId: input.clientId,
      timeframe: input.timeframe,
      search: input.search,
      page,
      pageSize,
    });

    return {
      events,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async deleteEvent(
    userId: string,
    eventId: string,
    ipAddress?: string,
  ): Promise<void> {
    const access = await enforceEventAccess(userId, eventId, "event:delete");

    const existing = await eventRepository.findById(access.organizationId, eventId);
    if (!existing) {
      throw new EventServiceError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    await eventRepository.softDelete(access.organizationId, eventId);

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.EVENT_DELETED,
      entity: "Event",
      entityId: eventId,
      metadata: { deleted: true, name: existing.name },
      ipAddress,
    });
  },
};
