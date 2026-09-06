import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EventSettingsForm } from "@/components/events/event-settings-form";
import { SettingsFormSkeleton } from "@/components/dashboard/org-skeletons";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { eventRepository } from "@/server/repositories/event.repository";

export default async function EventCollaboratorsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; eventId: string }>;
}) {
  const { orgSlug, eventId } = await params;
  const session = await requireAuth();
  const organizationId = (await getOrganizationBySlug(session.user.id, orgSlug)).id;
  const event = await eventRepository.findById(organizationId, eventId);

  if (!event) {
    notFound();
  }

  return (
    <Suspense fallback={<SettingsFormSkeleton />}>
      <EventSettingsForm event={event} initialTab="collaborators" />
    </Suspense>
  );
}
