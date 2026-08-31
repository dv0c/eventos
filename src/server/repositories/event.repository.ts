import {
  EventStatus,
  EventType,
  MediaStatus,
  type Prisma,
  TaskStatus,
} from "@prisma/client";

import { DEFAULT_EVENT_SETTINGS } from "@/server/events/default-settings";
import { prisma } from "@/server/db";

import { eventOrganizationScope, eventScope } from "./base";

export type EventWithRelations = Prisma.EventGetPayload<{
  include: {
    settings: true;
    theme: true;
    client: true;
  };
}>;

export interface CreateEventData {
  organizationId: string;
  name: string;
  slug: string;
  type?: EventType;
  status?: EventStatus;
  description?: string | null;
  date: Date;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  address?: string | null;
  hostName?: string | null;
  hostPhone?: string | null;
  hostEmail?: string | null;
  clientId?: string | null;
  expectedGuests?: number;
  expectedCouples?: number;
  expectedChildren?: number;
  expectedVip?: number;
  settings?: Prisma.EventSettingsCreateWithoutEventInput;
  theme?: Prisma.EventThemeCreateWithoutEventInput;
}

export interface EventOverviewStats {
  eventId: string;
  totalMedia: number;
  pendingMedia: number;
  approvedMedia: number;
  totalTasks: number;
  completedTasks: number;
  daysUntilEvent: number;
}

export type EventTimeframe = "active" | "upcoming" | "completed";

export interface ListEventsOptions {
  status?: EventStatus;
  type?: EventType;
  clientId?: string;
  timeframe?: EventTimeframe;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const eventRepository = {
  async findById(
    organizationId: string,
    eventId: string,
  ): Promise<EventWithRelations | null> {
    return prisma.event.findFirst({
      where: eventScope(eventId, organizationId),
      include: {
        settings: true,
        theme: true,
        client: true,
      },
    });
  },

  async findBySlug(slug: string): Promise<EventWithRelations | null> {
    return prisma.event.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      include: {
        settings: true,
        theme: true,
        client: true,
      },
    });
  },

  async findBySlugPublic(slug: string): Promise<EventWithRelations | null> {
    return prisma.event.findFirst({
      where: {
        slug,
        deletedAt: null,
        settings: {
          isPublic: true,
        },
      },
      include: {
        settings: true,
        theme: true,
        client: true,
      },
    });
  },

  async listByOrg(
    organizationId: string,
    options: ListEventsOptions = {},
  ): Promise<{ events: EventWithRelations[]; total: number }> {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const now = new Date();
    const timeframeFilter: Prisma.EventWhereInput = (() => {
      switch (options.timeframe) {
        case "active":
          return { status: EventStatus.ACTIVE };
        case "upcoming":
          return { date: { gte: now }, status: { notIn: [EventStatus.COMPLETED, EventStatus.ARCHIVED] } };
        case "completed":
          return {
            OR: [
              { status: { in: [EventStatus.COMPLETED, EventStatus.ARCHIVED] } },
              { date: { lt: now }, status: { not: EventStatus.ACTIVE } },
            ],
          };
        default:
          return {};
      }
    })();

    const where: Prisma.EventWhereInput = {
      ...eventOrganizationScope(organizationId),
      ...timeframeFilter,
      ...(options.status ? { status: options.status } : {}),
      ...(options.type ? { type: options.type } : {}),
      ...(options.clientId ? { clientId: options.clientId } : {}),
      ...(options.search
        ? {
            OR: [
              { name: { contains: options.search, mode: "insensitive" } },
              { location: { contains: options.search, mode: "insensitive" } },
              { hostName: { contains: options.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [events, total] = await prisma.$transaction([
      prisma.event.findMany({
        where,
        include: {
          settings: true,
          theme: true,
          client: true,
        },
        orderBy: [{ date: "asc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.event.count({ where }),
    ]);

    return { events, total };
  },

  async slugExists(slug: string): Promise<boolean> {
    const count = await prisma.event.count({
      where: { slug },
    });
    return count > 0;
  },

  async create(data: CreateEventData): Promise<EventWithRelations> {
    const {
      settings,
      theme,
      organizationId,
      slug,
      ...eventData
    } = data;

    return prisma.event.create({
      data: {
        ...eventData,
        organizationId,
        slug,
        settings: {
          create: { ...DEFAULT_EVENT_SETTINGS, ...settings },
        },
        theme: {
          create: theme ?? {},
        },
      },
      include: {
        settings: true,
        theme: true,
        client: true,
      },
    });
  },

  async getOverviewStats(eventId: string): Promise<EventOverviewStats | null> {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
      select: {
        id: true,
        date: true,
      },
    });

    if (!event) {
      return null;
    }

    const [mediaCounts, taskCounts] = await Promise.all([
      prisma.media.groupBy({
        by: ["status"],
        where: { eventId },
        _count: { _all: true },
      }),
      prisma.task.groupBy({
        by: ["status"],
        where: { eventId },
        _count: { _all: true },
      }),
    ]);

    let totalMedia = 0;
    let pendingMedia = 0;
    let approvedMedia = 0;

    for (const row of mediaCounts) {
      totalMedia += row._count._all;
      if (row.status === MediaStatus.PENDING) {
        pendingMedia += row._count._all;
      }
      if (row.status === MediaStatus.APPROVED || row.status === MediaStatus.FEATURED) {
        approvedMedia += row._count._all;
      }
    }

    let totalTasks = 0;
    let completedTasks = 0;
    for (const row of taskCounts) {
      totalTasks += row._count._all;
      if (row.status === TaskStatus.DONE) {
        completedTasks += row._count._all;
      }
    }

    const msUntilEvent = event.date.getTime() - Date.now();
    const daysUntilEvent = Math.ceil(msUntilEvent / (1000 * 60 * 60 * 24));

    return {
      eventId: event.id,
      totalMedia,
      pendingMedia,
      approvedMedia,
      totalTasks,
      completedTasks,
      daysUntilEvent,
    };
  },
};
