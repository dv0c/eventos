import type { DeliveryResult, MessagingProvider, OutboundMessage } from "./types";

export class TwilioSmsProvider implements MessagingProvider {
  async send(_message: OutboundMessage): Promise<DeliveryResult> {
    throw new Error("not configured");
  }
}
