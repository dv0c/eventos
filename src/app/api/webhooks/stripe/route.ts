import { getStripeClient } from "@/lib/stripe";
import { apiError, apiSuccess } from "@/lib/api-response";
import { billingService } from "@/server/services/billing.service";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return apiError("Stripe webhook is not configured", "NOT_CONFIGURED", 503);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return apiError("Missing stripe-signature header", "INVALID_SIGNATURE", 400);
  }

  const body = await request.text();

  let event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid webhook signature";
    return apiError(message, "INVALID_SIGNATURE", 400);
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = await billingService.syncSubscriptionFromStripe(
          event.data.object,
        );
        if (subscription) {
          await billingService.logSubscriptionChange(
            subscription.organizationId,
            null,
            { eventType: event.type, subscriptionId: subscription.id },
          );
        }
        break;
      }
      case "customer.subscription.deleted":
        await billingService.handleSubscriptionDeleted(event.data.object);
        break;
      case "invoice.paid":
      case "invoice.payment_failed":
        await billingService.syncInvoiceFromStripe(event.data.object);
        break;
      default:
        console.log("[stripe webhook] Unhandled event type:", event.type);
    }
  } catch (error) {
    console.error("[stripe webhook] Handler error:", error);
    return apiError("Webhook handler failed", "WEBHOOK_HANDLER_ERROR", 500);
  }

  return apiSuccess({ received: true });
}
