export interface OutboundMessage {
  to: string;
  subject?: string;
  html?: string;
  text?: string;
  templateId?: string;
  metadata?: Record<string, string>;
}

export interface DeliveryResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface MessagingProvider {
  send(message: OutboundMessage): Promise<DeliveryResult>;
}
