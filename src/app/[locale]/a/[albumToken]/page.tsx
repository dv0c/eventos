import { notFound, redirect } from "next/navigation";

import { PublicAlbumShell } from "@/components/media/album/public-album-feed";
import { getAppearanceFromSections } from "@/server/events/wall-settings";
import { mediaService, MediaServiceError } from "@/server/services/media.service";
import { prisma } from "@/server/db";

interface AlbumTokenPageProps {
  params: Promise<{ locale: string; albumToken: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function AlbumTokenPage({
  params,
  searchParams,
}: AlbumTokenPageProps) {
  const { locale, albumToken } = await params;
  const { tab } = await searchParams;

  try {
    const access = await mediaService.getAlbumAccessByToken(albumToken);

    const settings = await prisma.eventSettings.findUnique({
      where: { eventId: access.eventId },
      select: { sections: true },
    });
    const appearance = getAppearanceFromSections(settings?.sections);
    if (
      (appearance.displayLanguage === "en" || appearance.displayLanguage === "el") &&
      appearance.displayLanguage !== locale
    ) {
      const qs = tab ? `?tab=${tab}` : "";
      redirect(`/${appearance.displayLanguage}/a/${albumToken}${qs}`);
    }

    const initialTab = tab === "upload" ? "upload" : tab === "music" ? "music" : "feed";

    return (
      <PublicAlbumShell
        albumToken={access.albumToken}
        uploadToken={access.uploadToken}
        initialTab={initialTab}
      />
    );
  } catch (error) {
    if (error instanceof MediaServiceError) {
      notFound();
    }
    throw error;
  }
}
