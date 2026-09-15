import Stripe from "stripe";

import { prisma } from "@/server/db";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

function isMissingCustomerError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string; type?: string };
  if (err.code === "resource_missing") return true;
  const message = err.message ?? "";
  return (
    message.includes("No such customer") ||
    message.includes("similar object exists in live mode") ||
    message.includes("similar object exists in test mode")
  );
}

/**
 * Returns a Stripe customer id valid for the current API key mode.
 * Clears stale live/test mismatched ids stored on the organization.
 */
export async function ensureOrganizationStripeCustomer(input: {
  organizationId: string;
  organizationName: string;
  existingCustomerId: string | null;
  email?: string | null;
  name?: string | null;
}): Promise<string> {
  const stripe = getStripeClient();
  const { organizationId, organizationName, existingCustomerId, email, name } =
    input;

  if (existingCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(existingCustomerId);
      if (!("deleted" in customer && customer.deleted)) {
        return existingCustomerId;
      }
    } catch (error) {
      if (!isMissingCustomerError(error)) throw error;
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: { stripeCustomerId: null },
    });
  }

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    name: name ?? organizationName,
    metadata: { organizationId },
  });

  await prisma.organization.update({
    where: { id: organizationId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
