import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { PublicAlbumShell } from "@/components/media/album/public-album-feed";
import { prisma } from "@/server/db";
import { getAppearanceFromSections } from "@/server/events/wall-settings";
import { mediaService, MediaServiceError } from "@/server/services/media.service";

interface AlbumTokenPageProps {
  params: Promise<{ locale: string; albumToken: string }>;
  searchParams: Promise<{ tab?: string }>;
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

export default async function AlbumTokenPage({
  params,
  searchParams,
}: AlbumTokenPageProps) {
  const { locale, albumToken } = await params;
  const { tab } = await searchParams;
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
      const qs = tab ? `?tab=${tab}` : "";
      redirect(`/${appearance.displayLanguage}/a/${albumToken}${qs}`);
    }

    // Waiting + no view: guest album not available yet (e.g. upload_only before start)
    if (access.waiting && !access.canView) {
      return (
        <WaitingMessage
          title={t("lifecycle.waiting")}
          message={t("lifecycle.notStartedGuestMessage")}
        />
      );
    }

    // Upload-only permission: guests may contribute but not browse the feed
    if (!access.canView && access.canUpload) {
      return (
        <PublicAlbumShell
          albumToken={access.albumToken}
          uploadToken={access.uploadToken}
          initialTab="upload"
          uploadOnly
        />
      );
    }

    if (!access.canView) {
      notFound();
    }

    const initialTab =
      tab === "upload"
        ? "upload"
        : tab === "music"
          ? "music"
          : tab === "games"
            ? "games"
            : "feed";

    // waiting && canView: feed is viewable; uploadToken is null until the event starts
    return (
      <PublicAlbumShell
        albumToken={access.albumToken}
        uploadToken={access.uploadToken}
        initialTab={initialTab}
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
