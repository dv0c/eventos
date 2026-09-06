import {
  AuditAction,
  DeliveryStatus,
  GuestStatus,
  MessageChannel,
  MessageType,
  type Message,
  type MessageTemplate,
} from "@prisma/client";
import { nanoid } from "nanoid";

import { prisma } from "@/server/db";
import {
  emailQueue,
  scheduledMessagesQueue,
  smsQueue,
  whatsappQueue,
} from "@/server/jobs/queues";
import { enforceEventAccess } from "@/server/permissions/enforce";

import { auditService } from "./audit.service";
import { invitationService } from "./invitation.service";
import { planLimitsService } from "./plan-limits.service";

export class MessageServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "MessageServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface SendMessageInput {
  type: MessageType;
  channel?: MessageChannel;
  subject?: string;
  body?: string;
  guestIds?: string[];
  sendToAll?: boolean;
  scheduledAt?: Date;
  templateId?: string;
}

export interface MessageWithDeliveries extends Message {
  deliveries: {
    id: string;
    recipientEmail: string | null;
    recipientPhone: string | null;
    status: DeliveryStatus;
    sentAt: Date | null;
    errorMessage: string | null;
  }[];
}

const DEFAULT_TEMPLATES: Omit<MessageTemplate, "id" | "createdAt" | "updatedAt">[] = [
  {
    eventId: null,
    name: "Invitation",
    channel: MessageChannel.EMAIL,
    type: MessageType.INVITATION,
    subject: "Πρόσκληση: {{eventName}}",
    body: "Καλησπέρα {{firstName}},\n\nΈχετε προσκληθεί στο {{eventName}}.\n\nΑπαντήστε εδώ: {{rsvpLink}}",
    locale: "el",
  },
  {
    eventId: null,
    name: "RSVP Reminder",
    channel: MessageChannel.EMAIL,
    type: MessageType.RSVP_REMINDER,
    subject: "Υπενθύμιση RSVP — {{eventName}}",
    body: "Καλησπέρα {{firstName}},\n\nΥπενθυμίζουμε να απαντήσετε στην πρόσκληση για {{eventName}}.\n\n{{rsvpLink}}",
    locale: "el",
  },
];

function substituteTemplateVars(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

async function enqueueDelivery(
  channel: MessageChannel,
  deliveryId: string,
  payload: {
    to: string;
    subject?: string;
    body: string;
    eventId: string;
  },
): Promise<void> {
  const jobName = "send-message";
  const jobData = {
    deliveryId,
    to: payload.to,
    subject: payload.subject,
    body: payload.body,
    eventId: payload.eventId,
    channel,
  };

  switch (channel) {
    case MessageChannel.EMAIL:
      await emailQueue.add(jobName, jobData);
      break;
    case MessageChannel.SMS:
      await smsQueue.add(jobName, jobData);
      break;
    case MessageChannel.WHATSAPP:
      await whatsappQueue.add(jobName, jobData);
      break;
  }
}

export const messageService = {
  async listMessages(
    userId: string,
    eventId: string,
  ): Promise<MessageWithDeliveries[]> {
    await enforceEventAccess(userId, eventId, "message:read");

    return prisma.message.findMany({
      where: { eventId },
      include: {
        deliveries: {
          select: {
            id: true,
            recipientEmail: true,
            recipientPhone: true,
            status: true,
            sentAt: true,
            errorMessage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async listTemplates(
    userId: string,
    eventId: string,
  ): Promise<(MessageTemplate | (typeof DEFAULT_TEMPLATES)[number])[]> {
    await enforceEventAccess(userId, eventId, "message:read");

    const dbTemplates = await prisma.messageTemplate.findMany({
      where: { OR: [{ eventId }, { eventId: null }] },
      orderBy: { name: "asc" },
    });

    if (dbTemplates.length > 0) {
      return dbTemplates;
    }

    return DEFAULT_TEMPLATES;
  },

  async sendOrSchedule(
    userId: string,
    eventId: string,
    input: SendMessageInput,
    ipAddress?: string,
  ) {
    if (input.type === MessageType.INVITATION) {
      return invitationService.sendInvitations(
        userId,
        eventId,
        {
          guestIds: input.guestIds,
          sendToAll: input.sendToAll,
          channel: input.channel,
          subject: input.subject,
          body: input.body,
        },
        ipAddress,
      );
    }

    if (input.type === MessageType.RSVP_REMINDER && !input.scheduledAt) {
      return invitationService.sendRsvpReminders(userId, eventId, ipAddress);
    }

    const access = await enforceEventAccess(userId, eventId, "message:send");
    await planLimitsService.assertWithinLimit(access.organizationId, "messages", 1);

    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new MessageServiceError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    const channel = input.channel ?? MessageChannel.EMAIL;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const locale = "el";

    let subject = input.subject ?? `Μήνυμα: ${event.name}`;
    let bodyTemplate =
      input.body ??
      "Καλησπέρα {{firstName}},\n\nΜήνυμα για {{eventName}}.\n\n{{rsvpLink}}";

    if (input.templateId) {
      const template = await prisma.messageTemplate.findFirst({
        where: {
          id: input.templateId,
          OR: [{ eventId }, { eventId: null }],
        },
      });
      if (template) {
        subject = input.subject ?? template.subject ?? subject;
        bodyTemplate = input.body ?? template.body;
      }
    }

    const guestWhere = input.sendToAll
      ? channel === MessageChannel.EMAIL
        ? {
            eventId,
            deletedAt: null,
            AND: [{ email: { not: null } }, { email: { not: "" } }],
          }
        : {
            eventId,
            deletedAt: null,
            AND: [{ phone: { not: null } }, { phone: { not: "" } }],
          }
      : {
          eventId,
          deletedAt: null,
          id: { in: input.guestIds ?? [] },
        };

    const guests = await prisma.guest.findMany({
      where: guestWhere,
      include: { invitation: true },
    });

    if (guests.length === 0) {
      throw new MessageServiceError(
        channel === MessageChannel.EMAIL
          ? "No guests with an email address found"
          : "No guests with a phone number found",
        400,
        "NO_RECIPIENTS",
      );
    }

    if (channel === MessageChannel.EMAIL) {
      await invitationService.ensureTokens(
        eventId,
        guests.map((g) => g.id),
      );
    }

    const refreshedGuests = await prisma.guest.findMany({
      where: { id: { in: guests.map((g) => g.id) } },
      include: { invitation: true },
    });

    const isScheduled = !!input.scheduledAt && input.scheduledAt > new Date();

    const message = await prisma.message.create({
      data: {
        eventId,
        templateId: input.templateId,
        channel,
        type: input.type,
        subject,
        body: bodyTemplate,
        scheduledAt: input.scheduledAt,
        status: isScheduled ? DeliveryStatus.QUEUED : DeliveryStatus.QUEUED,
      },
    });

    const deliveries: {
      deliveryId: string;
      to: string;
      body: string;
    }[] = [];

    for (const guest of refreshedGuests) {
      const rsvpLink = guest.invitation
        ? `${baseUrl}/${locale}/e/${event.slug}/rsvp/${guest.invitation.rsvpToken}`
        : `${baseUrl}/${locale}/e/${event.slug}`;

      const body = substituteTemplateVars(bodyTemplate, {
        firstName: guest.firstName,
        lastName: guest.lastName,
        eventName: event.name,
        rsvpLink,
      });

      const recipientEmail =
        channel === MessageChannel.EMAIL
          ? guest.email?.trim() || null
          : null;
      const recipientPhone =
        channel !== MessageChannel.EMAIL
          ? guest.phone?.trim() || null
          : null;

      if (!recipientEmail && !recipientPhone) continue;

      const delivery = await prisma.messageDelivery.create({
        data: {
          messageId: message.id,
          recipientEmail,
          recipientPhone,
          status: DeliveryStatus.QUEUED,
        },
      });

      const to = recipientEmail ?? recipientPhone!;
      deliveries.push({ deliveryId: delivery.id, to, body });
    }

    if (deliveries.length === 0) {
      throw new MessageServiceError(
        channel === MessageChannel.EMAIL
          ? "No guests with an email address found"
          : "No guests with a phone number found",
        400,
        "NO_RECIPIENTS",
      );
    }

    const hasResend = !!process.env.RESEND_API_KEY;

    if (isScheduled) {
      const delay = input.scheduledAt!.getTime() - Date.now();
      await scheduledMessagesQueue.add(
        "deliver-scheduled",
        { messageId: message.id },
        { delay: Math.max(0, delay) },
      );
    } else if (hasResend || channel !== MessageChannel.EMAIL) {
      try {
        for (const { deliveryId, to, body } of deliveries) {
          await enqueueDelivery(channel, deliveryId, {
            to,
            subject,
            body,
            eventId,
          });
        }
      } catch {
        // Queue unavailable — deliveries remain queued
      }
    }

    if (
      !isScheduled &&
      input.type === MessageType.RSVP_REMINDER &&
      channel === MessageChannel.EMAIL
    ) {
      await prisma.guest.updateMany({
        where: { id: { in: refreshedGuests.map((g) => g.id) } },
        data: { invitationStatus: "reminded" },
      });
    }

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.MESSAGE_SENT,
      entity: "Message",
      entityId: message.id,
      metadata: {
        recipientCount: deliveries.length,
        channel,
        scheduled: isScheduled,
        type: input.type,
      },
      ipAddress,
    });

    return {
      messageId: message.id,
      recipientCount: deliveries.length,
      queued: !isScheduled && (hasResend || channel !== MessageChannel.EMAIL),
      scheduled: isScheduled,
      scheduledAt: input.scheduledAt,
    };
  },

  async processScheduledMessage(messageId: string): Promise<void> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        event: true,
        deliveries: true,
      },
    });

    if (!message || message.sentAt) {
      return;
    }

    if (message.scheduledAt && message.scheduledAt > new Date()) {
      const delay = message.scheduledAt.getTime() - Date.now();
      await scheduledMessagesQueue.add(
        "deliver-scheduled",
        { messageId },
        { delay },
      );
      return;
    }

    const guestsByEmail = await prisma.guest.findMany({
      where: {
        eventId: message.eventId,
        email: {
          in: message.deliveries
            .map((d) => d.recipientEmail)
            .filter((e): e is string => !!e),
        },
      },
      include: { invitation: true },
    });

    const guestByEmail = new Map(
      guestsByEmail.map((g) => [g.email!.toLowerCase(), g]),
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const locale = "el";

    for (const delivery of message.deliveries) {
      if (delivery.status !== DeliveryStatus.QUEUED) continue;

      const guest = delivery.recipientEmail
        ? guestByEmail.get(delivery.recipientEmail.toLowerCase())
        : undefined;

      const rsvpLink = guest?.invitation
        ? `${baseUrl}/${locale}/e/${message.event.slug}/rsvp/${guest.invitation.rsvpToken}`
        : `${baseUrl}/${locale}/e/${message.event.slug}`;

      const body = guest
        ? substituteTemplateVars(message.body, {
            firstName: guest.firstName,
            lastName: guest.lastName,
            eventName: message.event.name,
            rsvpLink,
          })
        : message.body;

      const to = delivery.recipientEmail ?? delivery.recipientPhone;
      if (!to) continue;

      try {
        await enqueueDelivery(message.channel, delivery.id, {
          to,
          subject: message.subject ?? undefined,
          body,
          eventId: message.eventId,
        });
      } catch {
        // Leave delivery queued
      }
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { sentAt: new Date() },
    });
  },
};
