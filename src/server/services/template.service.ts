import {
  AuditAction,
  EventStatus,
  EventType,
  type EventTemplate,
  type Prisma,
} from "@prisma/client";

import { generateUniqueEventSlug } from "@/lib/slug";
import { DEFAULT_EVENT_SETTINGS } from "@/server/events/default-settings";
import { prisma } from "@/server/db";
import { enforceEventAccess, enforceOrganizationAccess } from "@/server/permissions/enforce";
import { eventRepository } from "@/server/repositories/event.repository";

import { auditService } from "./audit.service";

export interface TemplateDefaults {
  tasks?: Array<{
    name: string;
    description?: string | null;
    priority?: string;
    dueDateOffsetDays?: number;
  }>;
  timeline?: Array<{
    time: string;
    title: string;
    location?: string | null;
    description?: string | null;
    responsible?: string | null;
    sortOrder?: number;
  }>;
  settings?: Record<string, unknown>;
  theme?: Record<string, unknown>;
}

export class TemplateServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "TemplateServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const templateService = {
  async listTemplates(userId: string, organizationId: string) {
    await enforceOrganizationAccess(userId, organizationId, "org:read");

    return prisma.eventTemplate.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
    });
  },

  async createFromEvent(
    userId: string,
    organizationId: string,
    eventId: string,
    name: string,
    ipAddress?: string,
  ): Promise<EventTemplate> {
    await enforceEventAccess(userId, eventId, "event:read");

    const event = await prisma.event.findFirst({
      where: { id: eventId, organizationId, deletedAt: null },
      include: {
        settings: true,
        theme: true,
        tasks: true,
        timelineItems: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!event) {
      throw new TemplateServiceError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    const defaults: TemplateDefaults = {
      tasks: event.tasks.map((t) => ({
        name: t.name,
        description: t.description,
        priority: t.priority,
        dueDateOffsetDays: t.dueDate
          ? Math.ceil((t.dueDate.getTime() - event.date.getTime()) / (1000 * 60 * 60 * 24))
          : undefined,
      })),
      timeline: event.timelineItems.map((item) => ({
        time: item.time,
        title: item.title,
        location: item.location,
        description: item.description,
        responsible: item.responsible,
        sortOrder: item.sortOrder,
      })),
      settings: event.settings
        ? {
            isPublic: event.settings.isPublic,
            allowRsvp: event.settings.allowRsvp,
            requirePhone: event.settings.requirePhone,
            requireEmail: event.settings.requireEmail,
            allowPlusOnes: event.settings.allowPlusOnes,
            allowChildren: event.settings.allowChildren,
            allowMaybe: event.settings.allowMaybe,
            enableGallery: event.settings.enableGallery,
            enableWall: event.settings.enableWall,
            indexable: event.settings.indexable,
            sections: event.settings.sections,
          }
        : {},
      theme: event.theme
        ? {
            primaryColor: event.theme.primaryColor,
            secondaryColor: event.theme.secondaryColor,
            accentColor: event.theme.accentColor,
            fontHeading: event.theme.fontHeading,
            fontBody: event.theme.fontBody,
            style: event.theme.style,
          }
        : {},
    };

    const template = await prisma.eventTemplate.create({
      data: {
        organizationId,
        name: name.trim(),
        type: event.type,
        description: event.description,
        defaults: defaults as Prisma.InputJsonValue,
      },
    });

    await auditService.logAudit({
      userId,
      organizationId,
      eventId,
      action: AuditAction.EVENT_CREATED,
      entity: "EventTemplate",
      entityId: template.id,
      metadata: { fromEventId: eventId, name: template.name },
      ipAddress,
    });

    return template;
  },

  async cloneToEvent(
    userId: string,
    organizationId: string,
    templateId: string,
    eventInput: {
      name: string;
      date: Date;
      clientId?: string;
      location?: string;
    },
    ipAddress?: string,
  ) {
    await enforceOrganizationAccess(userId, organizationId, "event:create");

    const template = await prisma.eventTemplate.findFirst({
      where: { id: templateId, organizationId },
    });

    if (!template) {
      throw new TemplateServiceError("Template not found", 404, "TEMPLATE_NOT_FOUND");
    }

    const defaults = template.defaults as TemplateDefaults;
    const slug = await generateUniqueEventSlug(eventInput.name, (candidate) =>
      eventRepository.slugExists(candidate),
    );

    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: {
          organizationId,
          name: eventInput.name.trim(),
          slug,
          type: template.type,
          status: EventStatus.DRAFT,
          date: eventInput.date,
          clientId: eventInput.clientId ?? null,
          location: eventInput.location ?? null,
          settings: {
            create: {
              ...DEFAULT_EVENT_SETTINGS,
              ...((defaults.settings ?? {}) as Prisma.EventSettingsCreateWithoutEventInput),
            },
          },
          theme: {
            create: (defaults.theme ?? {}) as Prisma.EventThemeCreateWithoutEventInput,
          },
        },
        include: { settings: true, theme: true, client: true },
      });

      if (defaults.tasks?.length) {
        await tx.task.createMany({
          data: defaults.tasks.map((task) => ({
            eventId: created.id,
            name: task.name,
            description: task.description ?? null,
            priority: (task.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT") ?? "MEDIUM",
            dueDate: task.dueDateOffsetDays
              ? new Date(
                  eventInput.date.getTime() +
                    task.dueDateOffsetDays * 24 * 60 * 60 * 1000,
                )
              : null,
          })),
        });
      }

      if (defaults.timeline?.length) {
        await tx.timelineItem.createMany({
          data: defaults.timeline.map((item, index) => ({
            eventId: created.id,
            time: item.time,
            title: item.title,
            location: item.location ?? null,
            description: item.description ?? null,
            responsible: item.responsible ?? null,
            sortOrder: item.sortOrder ?? index,
          })),
        });
      }

      return created;
    });

    await auditService.logAudit({
      userId,
      organizationId,
      eventId: event.id,
      action: AuditAction.EVENT_CREATED,
      entity: "Event",
      entityId: event.id,
      metadata: { fromTemplateId: templateId, name: event.name },
      ipAddress,
    });

    return event;
  },

  async deleteTemplate(
    userId: string,
    organizationId: string,
    templateId: string,
    ipAddress?: string,
  ): Promise<void> {
    await enforceOrganizationAccess(userId, organizationId, "org:update");

    const template = await prisma.eventTemplate.findFirst({
      where: { id: templateId, organizationId },
    });

    if (!template) {
      throw new TemplateServiceError("Template not found", 404, "TEMPLATE_NOT_FOUND");
    }

    await prisma.eventTemplate.delete({ where: { id: templateId } });

    await auditService.logAudit({
      userId,
      organizationId,
      action: AuditAction.ORG_UPDATED,
      entity: "EventTemplate",
      entityId: templateId,
      metadata: { deleted: true },
      ipAddress,
    });
  },
};
