import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { PublicAlbumShell } from "@/components/media/album/public-album-feed";
import { prisma } from "@/server/db";
import { getAppearanceFromSections } from "@/server/events/wall-settings";
import { mediaService, MediaServiceError } from "@/server/services/media.service";

interface AlbumMediaPageProps {
  params: Promise<{ locale: string; albumToken: string; mediaId: string }>;
}

function WaitingMessage({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export default async function AlbumMediaPage({ params }: AlbumMediaPageProps) {
  const { locale, albumToken, mediaId } = await params;
  const t = await getTranslations("events");

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
      redirect(`/${appearance.displayLanguage}/a/${albumToken}/m/${mediaId}`);
    }

    if (access.waiting && !access.canView) {
      return (
        <WaitingMessage
          title={t("lifecycle.waiting")}
          message={t("lifecycle.notStartedGuestMessage")}
        />
      );
    }

    // Upload-only guests cannot browse media detail
    if (!access.canView) {
      if (access.canUpload) {
        redirect(`/${locale}/a/${albumToken}?tab=upload`);
      }
      notFound();
    }

    return (
      <PublicAlbumShell
        albumToken={access.albumToken}
        uploadToken={access.uploadToken}
        initialTab="feed"
        initialMediaId={mediaId}
      />
    );
  } catch (error) {
    if (error instanceof MediaServiceError) {
      if (error.code === "EVENT_NOT_STARTED") {
        return (
          <WaitingMessage
            title={t("lifecycle.waiting")}
            message={t("lifecycle.notStartedGuestMessage")}
          />
        );
      }
      notFound();
    }
    throw error;
  }
}
