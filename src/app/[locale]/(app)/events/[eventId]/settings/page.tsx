import { notFound } from "next/navigation";

import { EventSettingsForm } from "@/components/events/event-settings-form";
import {
  getActiveOrganizationId,
  requireAuth,
} from "@/server/auth/session";
import { eventRepository } from "@/server/repositories/event.repository";

interface SettingsPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventSettingsPage({ params }: SettingsPageProps) {
  const { eventId } = await params;
  await requireAuth();
  const organizationId = await getActiveOrganizationId();

  if (!organizationId) {
    notFound();
  }

  const event = await eventRepository.findById(organizationId, eventId);

  if (!event) {
    notFound();
  }

  return <EventSettingsForm event={event} />;
}
