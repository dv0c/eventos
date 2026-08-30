import type { Job } from "bullmq";
import { DeliveryStatus, MessageChannel } from "@prisma/client";
import { Worker } from "bullmq";

import { prisma } from "@/server/db";
import { getMessagingProvider } from "@/server/providers/messaging";
import { messageService } from "@/server/services/message.service";
import { privacyService } from "@/server/services/privacy.service";

import { getRedisConnection, QUEUE_NAMES } from "./queues";

async function handleEmailJob(job: Job<{
  deliveryId?: string;
  to?: string;
  subject?: string;
  body?: string;
  channel?: MessageChannel;
}>) {
  const { deliveryId, to, subject, body } = job.data;

  if (!to || !subject || !body) {
    console.log("[email worker] Missing fields", job.id);
    return;
  }

  const provider = getMessagingProvider(MessageChannel.EMAIL);
  const result = await provider.send({
    to,
    subject,
    text: body,
  });

  if (deliveryId) {
    if (result.success) {
      await prisma.messageDelivery.update({
        where: { id: deliveryId },
        data: {
          status: DeliveryStatus.SENT,
          sentAt: new Date(),
          providerMessageId: result.providerMessageId ?? null,
        },
      });
    } else {
      await prisma.messageDelivery.update({
        where: { id: deliveryId },
        data: {
          status: DeliveryStatus.FAILED,
          errorMessage: result.error ?? "Send failed",
        },
      });
      throw new Error(result.error ?? "Email send failed");
    }
  }
}

async function handleSmsJob(job: Job<{
  deliveryId?: string;
  to?: string;
  body?: string;
}>) {
  const { deliveryId, to, body } = job.data;

  if (!to || !body) {
    console.log("[sms worker] Missing fields", job.id);
    return;
  }

  try {
    const provider = getMessagingProvider(MessageChannel.SMS);
    const result = await provider.send({ to, text: body });

    if (deliveryId) {
      await prisma.messageDelivery.update({
        where: { id: deliveryId },
        data: {
          status: result.success ? DeliveryStatus.SENT : DeliveryStatus.FAILED,
          sentAt: result.success ? new Date() : undefined,
          providerMessageId: result.providerMessageId ?? null,
          errorMessage: result.error ?? null,
        },
      });
    }

    if (!result.success) {
      throw new Error(result.error ?? "SMS send failed");
    }
  } catch (error) {
    if (deliveryId) {
      await prisma.messageDelivery.update({
        where: { id: deliveryId },
        data: {
          status: DeliveryStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : "SMS not configured",
        },
      });
    }
    console.log("[sms worker] SMS not configured or failed", job.id);
  }
}

async function handleWhatsAppJob(job: Job<{
  deliveryId?: string;
  to?: string;
  body?: string;
}>) {
  const { deliveryId, to, body } = job.data;

  if (!to || !body) {
    console.log("[whatsapp worker] Missing fields", job.id);
    return;
  }

  try {
    const provider = getMessagingProvider(MessageChannel.WHATSAPP);
    const result = await provider.send({ to, text: body });

    if (deliveryId) {
      await prisma.messageDelivery.update({
        where: { id: deliveryId },
        data: {
          status: result.success ? DeliveryStatus.SENT : DeliveryStatus.FAILED,
          sentAt: result.success ? new Date() : undefined,
          providerMessageId: result.providerMessageId ?? null,
          errorMessage: result.error ?? null,
        },
      });
    }
  } catch (error) {
    if (deliveryId) {
      await prisma.messageDelivery.update({
        where: { id: deliveryId },
        data: {
          status: DeliveryStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : "WhatsApp not configured",
        },
      });
    }
    console.log("[whatsapp worker] WhatsApp stub — not sent", job.id);
  }
}

async function handleExportsJob(job: Job<{ userId?: string; type?: string }>) {
  const { userId, type } = job.data;

  if (type === "gdpr-export" && userId) {
    const data = await privacyService.exportUserData(userId);
    console.log("[exports worker] GDPR export completed for", userId, Object.keys(data));
    return data;
  }

  console.log("[exports worker] Processing job", job.id, job.data);
}

async function handleMediaProcessingJob(job: Job<{ mediaId?: string }>) {
  const { mediaId } = job.data;
  console.log("[media-processing worker] Queued for moderation", mediaId ?? job.id);
}

async function handleScheduledMessagesJob(job: Job<{ messageId?: string }>) {
  const { messageId } = job.data;

  if (messageId) {
    await messageService.processScheduledMessage(messageId);
    return;
  }

  console.log("[scheduled-messages worker] Processing job", job.id, job.data);
}

export function createWorkers() {
  const connection = getRedisConnection();

  const workers = [
    new Worker(QUEUE_NAMES.email, handleEmailJob, { connection }),
    new Worker(QUEUE_NAMES.sms, handleSmsJob, { connection }),
    new Worker(QUEUE_NAMES.whatsapp, handleWhatsAppJob, { connection }),
    new Worker(QUEUE_NAMES.exports, handleExportsJob, { connection }),
    new Worker(QUEUE_NAMES.mediaProcessing, handleMediaProcessingJob, { connection }),
    new Worker(QUEUE_NAMES.scheduledMessages, handleScheduledMessagesJob, { connection }),
  ];

  for (const worker of workers) {
    worker.on("completed", (job) => {
      console.log(`[${worker.name}] Job ${job.id} completed`);
    });
    worker.on("failed", (job, error) => {
      console.error(`[${worker.name}] Job ${job?.id} failed:`, error);
    });
  }

  return workers;
}
