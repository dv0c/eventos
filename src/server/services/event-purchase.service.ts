import {
  EventPurchasePurpose,
  EventPurchaseStatus,
  EventTier,
  EventType,
  type Prisma,
} from "@prisma/client";
import type Stripe from "stripe";

import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import { prisma } from "@/server/db";
import {
  FreeQuotaExceededError,
  getFreeEventQuotaState,
  isEventPremium,
} from "@/server/events/event-entitlement";
import { enforceEventAccess, enforceOrganizationAccess } from "@/server/permissions/enforce";
import {
  eventService,
  type CreateEventWizardInput,
} from "@/server/services/event.service";

export class EventPurchaseServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "EventPurchaseServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export type PremiumCreatePayload = {
  name: string;
  type?: EventType;
  description?: string;
  date: string;
  startTime?: string | null;
  expectedGuests?: number;
  expectedCouples?: number;
  expectedChildren?: number;
  expectedVip?: number;
  theme?: CreateEventWizardInput["theme"];
  games?: CreateEventWizardInput["games"];
};

function premiumPriceId(): string {
  const priceId = process.env.STRIPE_PRICE_PREMIUM_EVENT;
  if (!priceId) {
    throw new EventPurchaseServiceError(
      "Premium event price is not configured",
      503,
      "STRIPE_PRICE_NOT_CONFIGURED",
    );
  }
  return priceId;
}

async function ensureStripeCustomer(
  userId: string,
  organizationId: string,
): Promise<string> {
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, deletedAt: null },
  });
  if (!org) {
    throw new EventPurchaseServiceError("Organization not found", 404, "ORG_NOT_FOUND");
  }

  if (org.stripeCustomerId) return org.stripeCustomerId;

  const stripe = getStripeClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  const customer = await stripe.customers.create({
    email: user?.email ?? undefined,
    name: user?.name ?? org.name,
    metadata: { organizationId },
  });

  await prisma.organization.update({
    where: { id: organizationId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

async function resolveAmountCents(priceId: string): Promise<{
  amountCents: number;
  currency: string;
}> {
  const stripe = getStripeClient();
  const price = await stripe.prices.retrieve(priceId);
  return {
    amountCents: price.unit_amount ?? 0,
    currency: price.currency ?? "eur",
  };
}

export const eventPurchaseService = {
  async getQuota(userId: string) {
    return getFreeEventQuotaState(userId);
  },

  async createUpgradeCheckout(
    userId: string,
    eventId: string,
    orgSlug: string,
    locale = "el",
  ): Promise<{ url: string }> {
    if (!isStripeConfigured()) {
      throw new EventPurchaseServiceError(
        "Stripe is not configured",
        503,
        "STRIPE_NOT_CONFIGURED",
      );
    }

    const access = await enforceEventAccess(userId, eventId, "event:update");
    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: { id: true, tier: true, name: true, organizationId: true },
    });
    if (!event) {
      throw new EventPurchaseServiceError("Event not found", 404, "NOT_FOUND");
    }
    if (isEventPremium(event)) {
      throw new EventPurchaseServiceError(
        "Event is already Premium",
        400,
        "ALREADY_PREMIUM",
      );
    }

    const priceId = premiumPriceId();
    const { amountCents, currency } = await resolveAmountCents(priceId);
    const customerId = await ensureStripeCustomer(userId, access.organizationId);
    const stripe = getStripeClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const purchase = await prisma.eventPurchase.create({
      data: {
        eventId,
        organizationId: access.organizationId,
        userId,
        purpose: EventPurchasePurpose.UPGRADE,
        status: EventPurchaseStatus.PENDING,
        amountCents,
        currency,
      },
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/${locale}/org/${orgSlug}/events/${eventId}/overview?premium=1`,
      cancel_url: `${baseUrl}/${locale}/org/${orgSlug}/events/${eventId}/settings?canceled=1`,
      metadata: {
        purpose: "event_premium",
        purchaseId: purchase.id,
        eventId,
        organizationId: access.organizationId,
        userId,
      },
      payment_intent_data: {
        metadata: {
          purpose: "event_premium",
          purchaseId: purchase.id,
          eventId,
        },
      },
    });

    await prisma.eventPurchase.update({
      where: { id: purchase.id },
      data: { stripeSessionId: session.id },
    });

    if (!session.url) {
      throw new EventPurchaseServiceError(
        "Failed to create checkout session",
        500,
        "CHECKOUT_FAILED",
      );
    }

    return { url: session.url };
  },

  async createPremiumEventCheckout(
    userId: string,
    organizationId: string,
    orgSlug: string,
    payload: PremiumCreatePayload,
    locale = "el",
  ): Promise<{ url: string }> {
    if (!isStripeConfigured()) {
      throw new EventPurchaseServiceError(
        "Stripe is not configured",
        503,
        "STRIPE_NOT_CONFIGURED",
      );
    }

    await enforceOrganizationAccess(userId, organizationId, "event:create");

    const quota = await getFreeEventQuotaState(userId);
    if (quota.canCreateFree) {
      throw new EventPurchaseServiceError(
        "Free event slots remaining — create without purchase",
        400,
        "FREE_SLOTS_REMAINING",
      );
    }

    const priceId = premiumPriceId();
    const { amountCents, currency } = await resolveAmountCents(priceId);
    const customerId = await ensureStripeCustomer(userId, organizationId);
    const stripe = getStripeClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const purchase = await prisma.eventPurchase.create({
      data: {
        organizationId,
        userId,
        purpose: EventPurchasePurpose.CREATE,
        status: EventPurchaseStatus.PENDING,
        amountCents,
        currency,
        createPayload: payload as unknown as Prisma.InputJsonValue,
      },
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/${locale}/org/${orgSlug}/events/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/${locale}/org/${orgSlug}/events/new?canceled=1`,
      metadata: {
        purpose: "event_premium",
        purchaseId: purchase.id,
        organizationId,
        userId,
      },
      payment_intent_data: {
        metadata: {
          purpose: "event_premium",
          purchaseId: purchase.id,
        },
      },
    });

    await prisma.eventPurchase.update({
      where: { id: purchase.id },
      data: { stripeSessionId: session.id },
    });

    if (!session.url) {
      throw new EventPurchaseServiceError(
        "Failed to create checkout session",
        500,
        "CHECKOUT_FAILED",
      );
    }

    return { url: session.url };
  },

  async fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<{
    eventId: string | null;
  }> {
    if (session.metadata?.purpose !== "event_premium") {
      return { eventId: null };
    }

    const purchaseId = session.metadata.purchaseId;
    if (!purchaseId) return { eventId: null };

    const purchase = await prisma.eventPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) return { eventId: null };
    if (purchase.status === EventPurchaseStatus.PAID) {
      return { eventId: purchase.eventId };
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    const now = new Date();

    if (purchase.purpose === EventPurchasePurpose.UPGRADE) {
      if (!purchase.eventId) return { eventId: null };
      await prisma.$transaction([
        prisma.event.update({
          where: { id: purchase.eventId },
          data: {
            tier: EventTier.PREMIUM,
            premiumUnlockedAt: now,
          },
        }),
        prisma.eventPurchase.update({
          where: { id: purchase.id },
          data: {
            status: EventPurchaseStatus.PAID,
            paidAt: now,
            stripePaymentIntentId: paymentIntentId,
            stripeSessionId: session.id,
          },
        }),
      ]);
      return { eventId: purchase.eventId };
    }

    // CREATE
    const raw = purchase.createPayload as PremiumCreatePayload | null;
    if (!raw?.name || !raw.date) {
      await prisma.eventPurchase.update({
        where: { id: purchase.id },
        data: { status: EventPurchaseStatus.FAILED },
      });
      return { eventId: null };
    }

    const event = await eventService.createEvent(
      purchase.userId,
      {
        organizationId: purchase.organizationId,
        name: raw.name,
        type: raw.type,
        description: raw.description,
        date: new Date(raw.date),
        startTime: raw.startTime ?? null,
        expectedGuests: raw.expectedGuests,
        expectedCouples: raw.expectedCouples,
        expectedChildren: raw.expectedChildren,
        expectedVip: raw.expectedVip,
        theme: raw.theme,
        games: raw.games,
        tier: EventTier.PREMIUM,
        skipFreeQuota: true,
      },
    );

    await prisma.eventPurchase.update({
      where: { id: purchase.id },
      data: {
        status: EventPurchaseStatus.PAID,
        paidAt: now,
        eventId: event.id,
        stripePaymentIntentId: paymentIntentId,
        stripeSessionId: session.id,
      },
    });

    return { eventId: event.id };
  },

  async resolveSessionEventId(sessionId: string, userId: string): Promise<string | null> {
    const purchase = await prisma.eventPurchase.findFirst({
      where: { stripeSessionId: sessionId, userId },
      select: { eventId: true, status: true },
    });
    if (purchase?.eventId) return purchase.eventId;

    if (!isStripeConfigured()) return null;
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      const result = await this.fulfillCheckoutSession(session);
      return result.eventId;
    }
    return null;
  },
};

// Re-export for callers that need quota errors without circular imports
export { FreeQuotaExceededError };
