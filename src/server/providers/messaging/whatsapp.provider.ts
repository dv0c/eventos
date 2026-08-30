import type { DeliveryResult, MessagingProvider, OutboundMessage } from "./types";

export interface WhatsAppWebhookVerification {
  mode: string;
  token: string;
  challenge: string;
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookChange {
  field: string;
  value: WhatsAppWebhookValue;
}

export interface WhatsAppWebhookValue {
  messaging_product: string;
  metadata?: {
    display_phone_number?: string;
    phone_number_id?: string;
  };
  statuses?: WhatsAppMessageStatus[];
  messages?: WhatsAppInboundMessage[];
}

export interface WhatsAppMessageStatus {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
}

export interface WhatsAppInboundMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppWebhookEntry[];
}

export class WhatsAppBusinessProvider implements MessagingProvider {
  async send(_message: OutboundMessage): Promise<DeliveryResult> {
    throw new Error("not configured");
  }
}

export function parseWhatsAppWebhookPayload(body: unknown): WhatsAppWebhookPayload | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const payload = body as WhatsAppWebhookPayload;
  if (payload.object !== "whatsapp_business_account" || !Array.isArray(payload.entry)) {
    return null;
  }

  return payload;
}
