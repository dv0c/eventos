import { notFound } from "next/navigation";

import { ModeratorAlbumShell } from "@/components/media/album/moderator-album-shell";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { AccessError, enforceEventAccess } from "@/server/permissions/enforce";
import { eventRepository } from "@/server/repositories/event.repository";
import {
  getModerationFromSections,
  type AlbumPermission,
} from "@/server/events/wall-settings";
import { redirect } from "@/i18n/navigation";

interface ModeratorPageProps {
  params: Promise<{ locale: string; orgSlug: string; eventId: string }>;
}

export default async function EventModeratorPage({ params }: ModeratorPageProps) {
  const { locale, orgSlug, eventId } = await params;
  const session = await requireAuth();

  let organizationId: string;
  try {
    organizationId = (await getOrganizationBySlug(session.user.id, orgSlug)).id;
  } catch {
    notFound();
  }

  const event = await eventRepository.findById(organizationId, eventId);
  if (!event) {
    notFound();
  }

  try {
    await enforceEventAccess(session.user.id, eventId, "media:manage");
  } catch (error) {
    if (error instanceof AccessError) {
      redirect({ href: "/forbidden", locale });
    }
    throw error;
  }

  const moderation = getModerationFromSections(event.settings?.sections);
  const initialSettings = {
    requireManualApproval:
      event.settings?.requireManualApproval ?? moderation.requireManualApproval,
    disableLikes: moderation.disableLikes,
    albumPermission: moderation.albumPermission as AlbumPermission,
  };

  return (
    <ModeratorAlbumShell
      eventId={event.id}
      eventName={event.name}
      orgSlug={orgSlug}
      initialSettings={initialSettings}
    />
  );
}
