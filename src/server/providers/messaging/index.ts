import type { MessageChannel } from "@prisma/client";

import { ResendEmailProvider } from "./resend.provider";
import { TwilioSmsProvider } from "./sms.provider";
import type { MessagingProvider } from "./types";
import { WhatsAppBusinessProvider } from "./whatsapp.provider";

const providers: Partial<Record<MessageChannel, MessagingProvider>> = {};

export function getMessagingProvider(channel: MessageChannel): MessagingProvider {
  if (!providers[channel]) {
    switch (channel) {
      case "EMAIL":
        providers[channel] = new ResendEmailProvider();
        break;
      case "SMS":
        providers[channel] = new TwilioSmsProvider();
        break;
      case "WHATSAPP":
        providers[channel] = new WhatsAppBusinessProvider();
        break;
      default:
        throw new Error(`Unsupported messaging channel: ${channel}`);
    }
  }

  return providers[channel]!;
}
