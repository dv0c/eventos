import { apiError, apiSuccess } from "@/lib/api-response";
import { parseWhatsAppWebhookPayload } from "@/server/providers/messaging/whatsapp.provider";
import { persistWhatsAppWebhook } from "@/server/services/whatsapp-webhook.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (!verifyToken) {
    return apiError("WhatsApp webhook is not configured", "NOT_CONFIGURED", 503);
  }

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return apiError("Verification failed", "VERIFICATION_FAILED", 403);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const payload = parseWhatsAppWebhookPayload(body);
  if (!payload) {
    return apiError("Invalid WhatsApp webhook payload", "INVALID_PAYLOAD", 400);
  }

  try {
    await persistWhatsAppWebhook(body);
  } catch (error) {
    console.error("[whatsapp webhook] Persistence error:", error);
  }

  return apiSuccess({ received: true });
}
