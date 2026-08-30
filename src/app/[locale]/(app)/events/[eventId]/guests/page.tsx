import { GuestStatus } from "@prisma/client";
import { notFound } from "next/navigation";

import { GuestManager } from "@/components/guests/guest-manager";
import {
  getActiveOrganizationId,
  requireAuth,
} from "@/server/auth/session";
import { eventRepository } from "@/server/repositories/event.repository";
import { guestRepository } from "@/server/repositories/guest.repository";

interface GuestsPageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}

export default async function EventGuestsPage({
  params,
  searchParams,
}: GuestsPageProps) {
  const { eventId } = await params;
  const { page: pageParam, search, status: statusParam } = await searchParams;
  await requireAuth();
  const organizationId = await getActiveOrganizationId();

  if (!organizationId) {
    notFound();
  }

  const event = await eventRepository.findById(organizationId, eventId);
  if (!event) {
    notFound();
  }

  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const status =
    statusParam && Object.values(GuestStatus).includes(statusParam as GuestStatus)
      ? (statusParam as GuestStatus)
      : undefined;

  const { guests, totalPages, total } = await guestRepository.listByEvent(eventId, {
    page,
    pageSize: 20,
    search,
    status,
  });

  return (
    <GuestManager
      eventId={eventId}
      initialGuests={guests}
      initialPage={page}
      totalPages={totalPages}
      total={total}
      initialSearch={search}
      initialStatus={status}
    />
  );
}
