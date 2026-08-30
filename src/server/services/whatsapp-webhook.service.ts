import { WhatsAppDeliveryStatusEnum } from "@prisma/client";

import { prisma } from "@/server/db";
import { parseWhatsAppWebhookPayload } from "@/server/providers/messaging/whatsapp.provider";

function mapWhatsAppStatus(status: string): WhatsAppDeliveryStatusEnum {
  switch (status.toLowerCase()) {
    case "sent":
      return WhatsAppDeliveryStatusEnum.SENT;
    case "delivered":
      return WhatsAppDeliveryStatusEnum.DELIVERED;
    case "read":
      return WhatsAppDeliveryStatusEnum.READ;
    case "failed":
      return WhatsAppDeliveryStatusEnum.FAILED;
    default:
      return WhatsAppDeliveryStatusEnum.QUEUED;
  }
}

async function findOrCreateConversation(guestPhone: string, eventId?: string) {
  const existing = await prisma.whatsAppConversation.findFirst({
    where: {
      guestPhone,
      ...(eventId ? { eventId } : {}),
    },
  });

  if (existing) return existing;

  return prisma.whatsAppConversation.create({
    data: {
      guestPhone,
      eventId: eventId ?? null,
    },
  });
}

export async function persistWhatsAppWebhook(body: unknown): Promise<void> {
  const payload = parseWhatsAppWebhookPayload(body);
  if (!payload) return;

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      const value = change.value;

      if (value.messages) {
        for (const msg of value.messages) {
          const guestPhone = msg.from;
          const conversation = await findOrCreateConversation(guestPhone);

          await prisma.whatsAppMessage.create({
            data: {
              conversationId: conversation.id,
              body: msg.text?.body ?? `[${msg.type}]`,
              providerMessageId: msg.id,
              status: WhatsAppDeliveryStatusEnum.SENT,
              sentAt: new Date(Number.parseInt(msg.timestamp, 10) * 1000),
            },
          });
        }
      }

      if (value.statuses) {
        for (const statusUpdate of value.statuses) {
          const mappedStatus = mapWhatsAppStatus(statusUpdate.status);
          const timestamp = new Date(
            Number.parseInt(statusUpdate.timestamp, 10) * 1000,
          );

          const existingMessage = await prisma.whatsAppMessage.findFirst({
            where: { providerMessageId: statusUpdate.id },
          });

          if (existingMessage) {
            await prisma.whatsAppMessage.update({
              where: { id: existingMessage.id },
              data: {
                status: mappedStatus,
                ...(mappedStatus === WhatsAppDeliveryStatusEnum.DELIVERED
                  ? { deliveredAt: timestamp }
                  : {}),
                ...(mappedStatus === WhatsAppDeliveryStatusEnum.READ
                  ? { readAt: timestamp }
                  : {}),
                ...(mappedStatus === WhatsAppDeliveryStatusEnum.FAILED
                  ? { failedReason: statusUpdate.status }
                  : {}),
              },
            });

            await prisma.whatsAppDeliveryStatus.create({
              data: {
                messageId: existingMessage.id,
                status: mappedStatus,
                timestamp,
                metadata: { recipientId: statusUpdate.recipient_id },
              },
            });
          } else {
            const conversation = await findOrCreateConversation(
              statusUpdate.recipient_id,
            );

            const newMessage = await prisma.whatsAppMessage.create({
              data: {
                conversationId: conversation.id,
                body: "",
                providerMessageId: statusUpdate.id,
                status: mappedStatus,
                sentAt: timestamp,
              },
            });

            await prisma.whatsAppDeliveryStatus.create({
              data: {
                messageId: newMessage.id,
                status: mappedStatus,
                timestamp,
                metadata: { recipientId: statusUpdate.recipient_id },
              },
            });
          }
        }
      }
    }
  }
}
