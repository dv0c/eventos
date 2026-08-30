import { AuditAction, type Prisma, type TimelineItem } from "@prisma/client";

import { prisma } from "@/server/db";
import { enforceEventAccess } from "@/server/permissions/enforce";

import { auditService } from "./audit.service";

export class TimelineServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "TimelineServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface CreateTimelineItemInput {
  time: string;
  title: string;
  location?: string | null;
  description?: string | null;
  responsible?: string | null;
  sortOrder?: number;
}

export interface UpdateTimelineItemInput extends Partial<CreateTimelineItemInput> {}

async function ensureItemBelongsToEvent(eventId: string, itemId: string) {
  const item = await prisma.timelineItem.findFirst({
    where: { id: itemId, eventId },
  });

  if (!item) {
    throw new TimelineServiceError("Timeline item not found", 404, "TIMELINE_ITEM_NOT_FOUND");
  }

  return item;
}

export const timelineService = {
  async listItems(userId: string, eventId: string) {
    await enforceEventAccess(userId, eventId, "event:read");

    const items = await prisma.timelineItem.findMany({
      where: { eventId },
      orderBy: [{ sortOrder: "asc" }, { time: "asc" }],
    });

    return { items };
  },

  async createItem(
    userId: string,
    eventId: string,
    input: CreateTimelineItemInput,
    ipAddress?: string,
  ): Promise<TimelineItem> {
    const access = await enforceEventAccess(userId, eventId, "event:update");

    const maxSort = await prisma.timelineItem.aggregate({
      where: { eventId },
      _max: { sortOrder: true },
    });

    const item = await prisma.timelineItem.create({
      data: {
        eventId,
        time: input.time.trim(),
        title: input.title.trim(),
        location: input.location?.trim() || null,
        description: input.description ?? null,
        responsible: input.responsible?.trim() || null,
        sortOrder: input.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
      },
    });

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "TimelineItem",
      entityId: item.id,
      metadata: { action: "created", title: item.title },
      ipAddress,
    });

    return item;
  },

  async updateItem(
    userId: string,
    eventId: string,
    itemId: string,
    input: UpdateTimelineItemInput,
    ipAddress?: string,
  ) {
    const access = await enforceEventAccess(userId, eventId, "event:update");
    await ensureItemBelongsToEvent(eventId, itemId);

    const data: Prisma.TimelineItemUpdateInput = {};
    if (input.time !== undefined) data.time = input.time.trim();
    if (input.title !== undefined) data.title = input.title.trim();
    if (input.location !== undefined) data.location = input.location?.trim() || null;
    if (input.description !== undefined) data.description = input.description;
    if (input.responsible !== undefined) data.responsible = input.responsible?.trim() || null;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

    const item = await prisma.timelineItem.update({
      where: { id: itemId },
      data,
    });

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "TimelineItem",
      entityId: itemId,
      metadata: { action: "updated", ...input } as Prisma.InputJsonValue,
      ipAddress,
    });

    return item;
  },

  async deleteItem(
    userId: string,
    eventId: string,
    itemId: string,
    ipAddress?: string,
  ): Promise<void> {
    const access = await enforceEventAccess(userId, eventId, "event:update");
    await ensureItemBelongsToEvent(eventId, itemId);

    await prisma.timelineItem.delete({ where: { id: itemId } });

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "TimelineItem",
      entityId: itemId,
      metadata: { action: "deleted" },
      ipAddress,
    });
  },
};
