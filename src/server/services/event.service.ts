import {
  AuditAction,
  EventStatus,
  EventType,
  Prisma,
  QRCodeType,
} from "@prisma/client";

import { generateUniqueEventSlug } from "@/lib/slug";
import { DEFAULT_EVENT_SETTINGS } from "@/server/events/default-settings";
import { prisma } from "@/server/db";
import { enforceEventAccess, enforceOrganizationAccess } from "@/server/permissions/enforce";
import {
  eventRepository,
  type EventOverviewStats,
  type EventWithRelations,
} from "@/server/repositories/event.repository";

import { auditService } from "./audit.service";
import { mediaService } from "./media.service";

export interface CreateEventWizardInput {
  organizationId: string;
  name: string;
  type?: EventType;
  description?: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  location?: string;
  address?: string;
  hostName?: string;
  hostPhone?: string;
  hostEmail?: string;
  clientId?: string;
  expectedGuests?: number;
  expectedCouples?: number;
  expectedChildren?: number;
  expectedVip?: number;
  settings?: Prisma.EventSettingsCreateWithoutEventInput;
  theme?: Prisma.EventThemeCreateWithoutEventInput;
}

import type { EventTimeframe } from "@/server/repositories/event.repository";
import { planLimitsService } from "./plan-limits.service";

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

export const eventService = {
  async createEvent(
    userId: string,
    input: CreateEventWizardInput,
    ipAddress?: string,
  ): Promise<EventWithRelations> {
    await enforceOrganizationAccess(userId, input.organizationId, "event:create");
    await planLimitsService.assertWithinLimit(input.organizationId, "events");

    const slug = await generateUniqueEventSlug(input.name, (candidate) =>
      eventRepository.slugExists(candidate),
    );

    const event = await eventRepository.create({
      organizationId: input.organizationId,
      name: input.name.trim(),
      slug,
      type: input.type ?? EventType.OTHER,
      status: EventStatus.DRAFT,
      description: input.description ?? null,
      date: input.date,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      location: input.location ?? null,
      address: input.address ?? null,
      hostName: input.hostName ?? null,
      hostPhone: input.hostPhone ?? null,
      hostEmail: input.hostEmail ?? null,
      clientId: input.clientId ?? null,
      expectedGuests: input.expectedGuests ?? 0,
      expectedCouples: input.expectedCouples ?? 0,
      expectedChildren: input.expectedChildren ?? 0,
      expectedVip: input.expectedVip ?? 0,
      settings: { ...DEFAULT_EVENT_SETTINGS, ...input.settings },
      theme: input.theme,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const publicBase = `${baseUrl}/el/e/${event.slug}`;
    const albumToken = await mediaService.getUploadTokenForEvent(event.id);

    const organization = await prisma.organization.findFirst({
      where: { id: input.organizationId, deletedAt: null },
      select: { slug: true },
    });
    const orgSlug = organization?.slug ?? input.organizationId;
    const moderationUrl = `${baseUrl}/el/org/${orgSlug}/events/${event.id}/mod`;

    await prisma.qRCode.createMany({
      data: [
        { eventId: event.id, type: QRCodeType.EVENT, url: publicBase },
        { eventId: event.id, type: QRCodeType.RSVP, url: `${publicBase}?rsvp=1` },
        { eventId: event.id, type: QRCodeType.UPLOAD, url: `${baseUrl}/el/a/${albumToken}` },
        { eventId: event.id, type: QRCodeType.WALL, url: `${publicBase}/wall` },
        { eventId: event.id, type: QRCodeType.MODERATION, url: moderationUrl },
      ],
    });

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
};
