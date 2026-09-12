import { Queue } from "bullmq";
import IORedis from "ioredis";

export const QUEUE_NAMES = {
  email: "email",
  sms: "sms",
  whatsapp: "whatsapp",
  exports: "exports",
  mediaProcessing: "media-processing",
  scheduledMessages: "scheduled-messages",
  mediaRetention: "media-retention",
  eventCompletion: "event-completion",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

function createRedisConnection() {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    connectTimeout: 5000,
  });
}

let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = createRedisConnection();
  }
  return connection;
}

const queueInstances = new Map<QueueName, Queue>();

function getQueue(name: QueueName): Queue {
  if (!queueInstances.has(name)) {
    queueInstances.set(
      name,
      new Queue(name, {
        connection: getRedisConnection(),
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 500,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
        },
      }),
    );
  }
  return queueInstances.get(name)!;
}

export const emailQueue = getQueue(QUEUE_NAMES.email);
export const smsQueue = getQueue(QUEUE_NAMES.sms);
export const whatsappQueue = getQueue(QUEUE_NAMES.whatsapp);
export const exportsQueue = getQueue(QUEUE_NAMES.exports);
export const mediaProcessingQueue = getQueue(QUEUE_NAMES.mediaProcessing);
export const scheduledMessagesQueue = getQueue(QUEUE_NAMES.scheduledMessages);
export const mediaRetentionQueue = getQueue(QUEUE_NAMES.mediaRetention);
export const eventCompletionQueue = getQueue(QUEUE_NAMES.eventCompletion);

export const queues = {
  email: emailQueue,
  sms: smsQueue,
  whatsapp: whatsappQueue,
  exports: exportsQueue,
  mediaProcessing: mediaProcessingQueue,
  scheduledMessages: scheduledMessagesQueue,
  mediaRetention: mediaRetentionQueue,
  eventCompletion: eventCompletionQueue,
};
