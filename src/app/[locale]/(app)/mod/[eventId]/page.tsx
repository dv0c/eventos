import { notFound } from "next/navigation";

import { ModeratorAlbumShell } from "@/components/media/album/moderator-album-shell";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/server/db";
import {
  getModerationFromSections,
  type AlbumPermission,
} from "@/server/events/wall-settings";
import { requireAuth } from "@/server/auth/session";
import { AccessError, enforceEventAccess } from "@/server/permissions/enforce";

interface ModeratorAppPageProps {
  params: Promise<{ locale: string; eventId: string }>;
}

export default async function ModeratorAppPage({ params }: ModeratorAppPageProps) {
  const { locale, eventId } = await params;
  const session = await requireAuth();

  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    include: {
      settings: true,
      organization: { select: { slug: true } },
    },
  });

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
      orgSlug={event.organization.slug}
      initialSettings={initialSettings}
    />
  );
}
