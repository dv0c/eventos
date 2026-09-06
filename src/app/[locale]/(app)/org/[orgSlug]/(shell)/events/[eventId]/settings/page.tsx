import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EventSettingsForm } from "@/components/events/event-settings-form";
import { SettingsFormSkeleton } from "@/components/dashboard/org-skeletons";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { eventRepository } from "@/server/repositories/event.repository";

interface SettingsPageProps {
  params: Promise<{ orgSlug: string; eventId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function EventSettingsPage({ params, searchParams }: SettingsPageProps) {
  const { eventId, orgSlug } = await params;
  const { tab } = await searchParams;
  const session = await requireAuth();
  const organizationId = (await getOrganizationBySlug(session.user.id, orgSlug)).id;

  const event = await eventRepository.findById(organizationId, eventId);

  if (!event) {
    notFound();
  }

  const initialTab =
    tab === "appearance" ||
    tab === "photoWall" ||
    tab === "moderation" ||
    tab === "collaborators" ||
    tab === "general"
      ? tab
      : "general";

  return (
    <Suspense fallback={<SettingsFormSkeleton />}>
      <EventSettingsForm event={event} initialTab={initialTab} />
    </Suspense>
  );
}
