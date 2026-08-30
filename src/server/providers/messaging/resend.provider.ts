import { Resend } from "resend";

import type { DeliveryResult, MessagingProvider, OutboundMessage } from "./types";

export class ResendEmailProvider implements MessagingProvider {
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = process.env.EMAIL_FROM ?? "noreply@eventos.gr";
  }

  async send(message: OutboundMessage): Promise<DeliveryResult> {
    if (!this.resend) {
      console.log("[ResendEmailProvider] Email (console fallback):", {
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      return { success: true, providerMessageId: "console-fallback" };
    }

    try {
      const payload = message.html
        ? {
            from: this.from,
            to: message.to,
            subject: message.subject ?? "Eventos",
            html: message.html,
            ...(message.text ? { text: message.text } : {}),
          }
        : {
            from: this.from,
            to: message.to,
            subject: message.subject ?? "Eventos",
            text: message.text ?? "",
          };

      const response = await this.resend.emails.send(payload);

      if (response.error) {
        return {
          success: false,
          error: response.error.message,
        };
      }

      return {
        success: true,
        providerMessageId: response.data?.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      };
    }
  }
}
