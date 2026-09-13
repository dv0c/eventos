import { redirect } from "next/navigation";

import { requireAuth } from "@/server/auth/session";
import { eventPurchaseService } from "@/server/services/event-purchase.service";

interface PageProps {
  params: Promise<{ locale: string; orgSlug: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export default async function PurchaseSuccessPage({ params, searchParams }: PageProps) {
  const { locale, orgSlug } = await params;
  const { session_id: sessionId } = await searchParams;
  const session = await requireAuth();

  if (!sessionId) {
    redirect(`/${locale}/org/${orgSlug}/events`);
  }

  const eventId = await eventPurchaseService.resolveSessionEventId(
    sessionId,
    session.user.id,
  );

  if (eventId) {
    redirect(`/${locale}/org/${orgSlug}/events/${eventId}/overview?premium=1`);
  }

  redirect(`/${locale}/org/${orgSlug}/events?purchase_pending=1`);
}
