import {
  AuditAction,
  SubscriptionStatus,
  type Invoice,
  type Plan,
  type Subscription,
  type UsageRecord,
} from "@prisma/client";
import type Stripe from "stripe";

import { getStripeClient } from "@/lib/stripe";
import { prisma } from "@/server/db";
import { enforceOrganizationAccess } from "@/server/permissions/enforce";

import { auditService } from "./audit.service";
import { planLimitsService } from "./plan-limits.service";

export class BillingServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "BillingServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "past_due":
      return SubscriptionStatus.PAST_DUE;
    case "canceled":
      return SubscriptionStatus.CANCELED;
    case "trialing":
      return SubscriptionStatus.TRIALING;
    default:
      return SubscriptionStatus.INCOMPLETE;
  }
}

export interface BillingOverview {
  plan: Plan;
  subscription: Subscription | null;
  usage: UsageRecord[];
  limits: Awaited<ReturnType<typeof planLimitsService.getLimits>>;
}

export const billingService = {
  async getBillingOverview(
    userId: string,
    organizationId: string,
  ): Promise<BillingOverview> {
    await enforceOrganizationAccess(userId, organizationId, "org:manage_billing");

    const org = await prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      include: {
        plan: true,
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        usageRecords: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!org) {
      throw new BillingServiceError("Organization not found", 404, "ORG_NOT_FOUND");
    }

    await planLimitsService.syncUsageRecords(organizationId);

    const usage = await prisma.usageRecord.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const limits = await planLimitsService.getLimits(organizationId);

    return {
      plan: org.plan,
      subscription: org.subscriptions[0] ?? null,
      usage,
      limits,
    };
  },

  async createCheckoutSession(
    userId: string,
    organizationId: string,
    planSlug: string,
    interval: "monthly" | "yearly" = "monthly",
  ): Promise<{ url: string }> {
    await enforceOrganizationAccess(userId, organizationId, "org:manage_billing");

    const plan = await prisma.plan.findFirst({
      where: { slug: planSlug, isActive: true },
    });

    if (!plan) {
      throw new BillingServiceError("Plan not found", 404, "PLAN_NOT_FOUND");
    }

    const priceId =
      interval === "yearly" ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;

    if (!priceId) {
      throw new BillingServiceError(
        "Stripe price not configured for this plan",
        400,
        "STRIPE_PRICE_NOT_CONFIGURED",
      );
    }

    const org = await prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
    });

    if (!org) {
      throw new BillingServiceError("Organization not found", 404, "ORG_NOT_FOUND");
    }

    const stripe = getStripeClient();
    let customerId = org.stripeCustomerId;

    if (!customerId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      const customer = await stripe.customers.create({
        email: user?.email ?? undefined,
        name: user?.name ?? org.name,
        metadata: { organizationId },
      });

      customerId = customer.id;
      await prisma.organization.update({
        where: { id: organizationId },
        data: { stripeCustomerId: customerId },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/el/billing?success=1`,
      cancel_url: `${baseUrl}/el/pricing?canceled=1`,
      metadata: { organizationId, planId: plan.id },
      subscription_data: {
        metadata: { organizationId, planId: plan.id },
      },
    });

    if (!session.url) {
      throw new BillingServiceError("Failed to create checkout session", 500, "CHECKOUT_FAILED");
    }

    return { url: session.url };
  },

  async syncSubscriptionFromStripe(
    stripeSubscription: Stripe.Subscription,
  ): Promise<Subscription | null> {
    const organizationId = stripeSubscription.metadata.organizationId;
    const planId = stripeSubscription.metadata.planId;

    if (!organizationId) {
      const customerId =
        typeof stripeSubscription.customer === "string"
          ? stripeSubscription.customer
          : stripeSubscription.customer.id;

      const org = await prisma.organization.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (!org) return null;
      return this.upsertSubscription(org.id, planId, stripeSubscription);
    }

    return this.upsertSubscription(organizationId, planId, stripeSubscription);
  },

  async upsertSubscription(
    organizationId: string,
    planId: string | undefined,
    stripeSubscription: Stripe.Subscription,
  ): Promise<Subscription> {
    let resolvedPlanId = planId;

    if (!resolvedPlanId) {
      const org = await prisma.organization.findFirst({
        where: { id: organizationId },
        select: { planId: true },
      });
      resolvedPlanId = org?.planId;
    }

    if (!resolvedPlanId) {
      const freePlan = await prisma.plan.findFirst({ where: { slug: "free" } });
      resolvedPlanId = freePlan?.id;
    }

    if (!resolvedPlanId) {
      throw new BillingServiceError("Plan not found", 404, "PLAN_NOT_FOUND");
    }

    const status = mapStripeStatus(stripeSubscription.status);
    const periodStart = new Date((stripeSubscription as Stripe.Subscription & { current_period_start: number }).current_period_start * 1000);
    const periodEnd = new Date((stripeSubscription as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000);

    const subscription = await prisma.subscription.upsert({
      where: { stripeSubscriptionId: stripeSubscription.id },
      create: {
        organizationId,
        planId: resolvedPlanId,
        stripeSubscriptionId: stripeSubscription.id,
        status,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
      update: {
        planId: resolvedPlanId,
        status,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });

    await prisma.organization.update({
      where: { id: organizationId },
      data: { planId: resolvedPlanId },
    });

    return subscription;
  },

  async syncInvoiceFromStripe(stripeInvoice: Stripe.Invoice): Promise<Invoice | null> {
    const subscriptionRef = (stripeInvoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }).subscription;
    const subscriptionId =
      typeof subscriptionRef === "string"
        ? subscriptionRef
        : subscriptionRef?.id;

    if (!subscriptionId) return null;

    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!subscription) return null;

    return prisma.invoice.upsert({
      where: { stripeInvoiceId: stripeInvoice.id },
      create: {
        subscriptionId: subscription.id,
        stripeInvoiceId: stripeInvoice.id,
        amount: stripeInvoice.amount_paid ?? stripeInvoice.amount_due ?? 0,
        currency: (stripeInvoice.currency ?? "eur").toUpperCase(),
        status: stripeInvoice.status ?? "open",
        paidAt: stripeInvoice.status_transitions?.paid_at
          ? new Date(stripeInvoice.status_transitions.paid_at * 1000)
          : null,
        dueDate: stripeInvoice.due_date
          ? new Date(stripeInvoice.due_date * 1000)
          : null,
        pdfUrl: stripeInvoice.invoice_pdf ?? null,
      },
      update: {
        amount: stripeInvoice.amount_paid ?? stripeInvoice.amount_due ?? 0,
        status: stripeInvoice.status ?? "open",
        paidAt: stripeInvoice.status_transitions?.paid_at
          ? new Date(stripeInvoice.status_transitions.paid_at * 1000)
          : null,
        pdfUrl: stripeInvoice.invoice_pdf ?? null,
      },
    });
  },

  async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    const existing = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!existing) return;

    const freePlan = await prisma.plan.findFirst({ where: { slug: "free" } });

    await prisma.subscription.update({
      where: { id: existing.id },
      data: { status: SubscriptionStatus.CANCELED },
    });

    if (freePlan) {
      await prisma.organization.update({
        where: { id: existing.organizationId },
        data: { planId: freePlan.id },
      });
    }
  },

  async logSubscriptionChange(
    organizationId: string,
    userId: string | null,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await auditService.logAudit({
      userId: userId ?? undefined,
      organizationId,
      action: AuditAction.SUBSCRIPTION_CHANGED,
      entity: "Subscription",
      metadata: metadata as import("@prisma/client").Prisma.InputJsonValue,
    });
  },
};
