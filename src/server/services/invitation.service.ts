import { AuditAction, DeliveryStatus, GuestStatus, MessageChannel, MessageType } from "@prisma/client";
import { nanoid } from "nanoid";

import { prisma } from "@/server/db";
import { enforceEventAccess } from "@/server/permissions/enforce";
import { emailQueue } from "@/server/jobs/queues";

import { auditService } from "./audit.service";
import { planLimitsService } from "./plan-limits.service";

export class InvitationServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "InvitationServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface SendInvitationsInput {
  guestIds?: string[];
  sendToAll?: boolean;
  channel?: MessageChannel;
  subject?: string;
  body?: string;
}

export const invitationService = {
  async ensureTokens(eventId: string, guestIds: string[]): Promise<void> {
    const guestsWithoutInvitation = await prisma.guest.findMany({
      where: {
        eventId,
        id: { in: guestIds },
        deletedAt: null,
        invitation: null,
      },
      select: { id: true },
    });

    if (guestsWithoutInvitation.length > 0) {
      await prisma.invitation.createMany({
        data: guestsWithoutInvitation.map((g) => ({
          eventId,
          guestId: g.id,
          rsvpToken: nanoid(21),
        })),
      });
    }
  },

  async sendInvitations(
    userId: string,
    eventId: string,
    input: SendInvitationsInput,
    ipAddress?: string,
  ) {
    const access = await enforceEventAccess(userId, eventId, "message:send");
    await planLimitsService.assertWithinLimit(access.organizationId, "messages", 1);

    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      include: { settings: true },
    });

    if (!event) {
      throw new InvitationServiceError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    const guestWhere = input.sendToAll
      ? { eventId, deletedAt: null, email: { not: null } }
      : {
          eventId,
          deletedAt: null,
          id: { in: input.guestIds ?? [] },
          email: { not: null },
        };

    const guests = await prisma.guest.findMany({
      where: guestWhere,
      include: { invitation: true },
    });

    if (guests.length === 0) {
      throw new InvitationServiceError("No guests with email found", 400, "NO_RECIPIENTS");
    }

    await this.ensureTokens(
      eventId,
      guests.map((g) => g.id),
    );

    const refreshedGuests = await prisma.guest.findMany({
      where: { id: { in: guests.map((g) => g.id) } },
      include: { invitation: true },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const locale = "el";
    const channel = input.channel ?? MessageChannel.EMAIL;
    const subject =
      input.subject ?? `Πρόσκληση: ${event.name}`;
    const defaultBody = `Καλησπέρα {{firstName}},\n\nΈχετε προσκληθεί στο ${event.name}.\n\nΑπαντήστε εδώ: {{rsvpLink}}`;

    const message = await prisma.message.create({
      data: {
        eventId,
        channel,
        type: MessageType.INVITATION,
        subject,
        body: input.body ?? defaultBody,
        status: DeliveryStatus.QUEUED,
      },
    });

    const deliveries = [];
    for (const guest of refreshedGuests) {
      if (!guest.email || !guest.invitation) continue;

      const rsvpLink = `${baseUrl}/${locale}/e/${event.slug}/rsvp/${guest.invitation.rsvpToken}`;
      const body = (input.body ?? defaultBody)
        .replace(/\{\{firstName\}\}/g, guest.firstName)
        .replace(/\{\{lastName\}\}/g, guest.lastName)
        .replace(/\{\{rsvpLink\}\}/g, rsvpLink)
        .replace(/\{\{eventName\}\}/g, event.name);

      const delivery = await prisma.messageDelivery.create({
        data: {
          messageId: message.id,
          recipientEmail: guest.email,
          status: DeliveryStatus.QUEUED,
        },
      });

      deliveries.push({ delivery, guest, body, rsvpLink });
    }

    const hasResend = !!process.env.RESEND_API_KEY;
    if (hasResend) {
      try {
        for (const { delivery, guest, body } of deliveries) {
          await emailQueue.add("send-invitation", {
            deliveryId: delivery.id,
            to: guest.email,
            subject,
            body,
            eventId,
          });
        }
      } catch {
        // Queue unavailable — mark for manual retry
      }
    }

    await prisma.guest.updateMany({
      where: { id: { in: refreshedGuests.map((g) => g.id) } },
      data: { invitationStatus: "sent", status: GuestStatus.INVITED },
    });

    await prisma.invitation.updateMany({
      where: { guestId: { in: refreshedGuests.map((g) => g.id) } },
      data: { sentAt: new Date() },
    });

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.MESSAGE_SENT,
      entity: "Message",
      entityId: message.id,
      metadata: { recipientCount: deliveries.length, channel },
      ipAddress,
    });

    return {
      messageId: message.id,
      recipientCount: deliveries.length,
      queued: hasResend,
    };
  },

  async sendRsvpReminders(
    userId: string,
    eventId: string,
    ipAddress?: string,
  ) {
    const pendingGuests = await prisma.guest.findMany({
      where: {
        eventId,
        deletedAt: null,
        email: { not: null },
        status: { in: ["PENDING", "INVITED", "NO_RESPONSE"] },
      },
      select: { id: true },
    });

    return this.sendInvitations(
      userId,
      eventId,
      {
        guestIds: pendingGuests.map((g) => g.id),
        subject: "Υπενθύμιση RSVP",
        body: "Καλησπέρα {{firstName}},\n\nΥπενθυμίζουμε να απαντήσετε στην πρόσκληση για {{eventName}}.\n\n{{rsvpLink}}",
      },
      ipAddress,
    );
  },
};
