import { notFound } from "next/navigation";

import { EventSettingsForm } from "@/components/events/event-settings-form";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { eventRepository } from "@/server/repositories/event.repository";

interface SettingsPageProps {
  params: Promise<{ orgSlug: string; eventId: string }>;
}

export default async function EventSettingsPage({ params }: SettingsPageProps) {
  const { eventId, orgSlug } = await params;
  const session = await requireAuth();
  const organizationId = (await getOrganizationBySlug(session.user.id, orgSlug)).id;

  const event = await eventRepository.findById(organizationId, eventId);

  if (!event) {
    notFound();
  }

  return <EventSettingsForm event={event} />;
}
