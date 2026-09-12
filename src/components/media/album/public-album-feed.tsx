"use client";

import { Camera, ChevronLeft, Gamepad2, Images, Mic, Music2, Play } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  focusAppScroll,
  MobileAppLock,
} from "@/components/media/album/mobile-app-lock";
import { AlbumAppShellSkeleton } from "@/components/media/album/album-app-skeletons";
import { AlbumSongRequestPanel } from "@/components/media/album/album-song-request-panel";
import {
  eventThemeStyle,
  type EventThemeColors,
} from "@/components/events/event-theme-scope";
import { StoryStudio } from "@/components/media/story/story-studio";
import { VoiceWishRecorder } from "@/components/media/album/voice-wish-recorder";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import {
  ALBUM_CHALLENGES,
  isAlbumChallengeId,
} from "@/lib/album-challenges";
import { resolveGameMode, type EventGameMode } from "@/lib/event-game-presets";
import { getOrCreateAlbumReactorKey } from "@/lib/album-reactor";
import { WALL_REACTION_EMOJIS } from "@/lib/wall-reactions";
import { cn } from "@/lib/utils";

export interface AlbumFeedItem {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  caption: string | null;
  uploadedBy: string | null;
  mimeType: string;
  challengeId: string | null;
  createdAt: string;
  reactionCounts: Record<string, number>;
}

interface AlbumFeedGame {
  id: string;
  title: string;
  description: string | null;
  presetKey: string | null;
  mode?: EventGameMode | string | null;
  coverImage: string | null;
}

type ActiveChallenge = {
  id: string;
  mode: EventGameMode;
  title: string;
  coverImage: string | null;
};

interface AlbumFeedData {
  eventName: string;
  canUpload: boolean;
  panic?: boolean;
  enableVoiceWishes?: boolean;
  enableSongRequests?: boolean;
  reactionsEnabled: boolean;
  disableGuestDownload: boolean;
  takenNames?: string[];
  allowPhotos?: boolean;
  allowVideos?: boolean;
  appearance?: {
    displayLanguage: string;
    welcomeScreenEnabled: boolean;
    welcomeScreenTitle: string | null;
    welcomeScreenMessage: string | null;
    removeBranding: boolean;
    captionTheme: "dark" | "light";
  };
  theme?: {
    primaryColor: string;
    secondaryColor?: string;
    accentColor?: string;
    logoUrl: string | null;
    albumBackgroundUrl: string | null;
  };
  branding?: {
    watermarkUrl: string | null;
  };
  games?: AlbumFeedGame[];
  items: AlbumFeedItem[];
}

type AlbumTab = "feed" | "games" | "upload" | "wishes" | "music";

interface PublicAlbumShellProps {
  albumToken: string;
  uploadToken: string | null;
  initialTab?: AlbumTab;
  /** Open media detail for this id (route `/a/.../m/[mediaId]`). */
  initialMediaId?: string;
  /** Hide feed/games (and other browse tabs); upload-only permission mode */
  uploadOnly?: boolean;
}

const GUEST_NAME_KEY = (token: string) => `eventos-guest-name:${token}`;

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function PublicAlbumShell({
  albumToken,
  uploadToken,
  initialTab = "feed",
  initialMediaId,
  uploadOnly = false,
}: PublicAlbumShellProps) {
  const t = useTranslations("publicEvent");
  const router = useRouter();
  const [tab, setTab] = useState<AlbumTab>(
    uploadOnly
      ? "upload"
      : initialTab === "upload"
        ? "upload"
        : initialTab === "games"
          ? "games"
          : initialTab === "music"
            ? "music"
            : "feed",
  );
  const [feed, setFeed] = useState<AlbumFeedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [nameReady, setNameReady] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [activeChallenge, setActiveChallenge] = useState<ActiveChallenge | null>(null);
  const [myReactions, setMyReactions] = useState<Record<string, string[]>>({});
  const [storyOpen, setStoryOpen] = useState(false);
  const autoOpenedStory = useRef(false);
  const [activeMediaId, setActiveMediaId] = useState<string | null>(
    initialMediaId ?? null,
  );
  const missingMediaHandled = useRef(false);

  useEffect(() => {
    setActiveMediaId(initialMediaId ?? null);
    missingMediaHandled.current = false;
  }, [initialMediaId]);

  useEffect(() => {
    if (!nameReady) return;
    const id = requestAnimationFrame(() => focusAppScroll(mainRef.current));
    return () => cancelAnimationFrame(id);
  }, [tab, nameReady, activeMediaId]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(GUEST_NAME_KEY(albumToken));
      if (stored?.trim()) {
        setGuestName(stored.trim());
        setNameReady(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, [albumToken]);

  const loadFeed = useCallback(async (opts?: { showLoader?: boolean }) => {
    if (opts?.showLoader) setLoading(true);
    try {
      const response = await fetch(`/api/public/album/${albumToken}/feed`, {
        cache: "no-store",
      });
      if (!response.ok) {
        setError(t("albumLoadError"));
        setLoading(false);
        return;
      }
      const json = await response.json();
      setFeed(json.data as AlbumFeedData);
      setError(null);
    } catch {
      setError(t("albumLoadError"));
    }
    setLoading(false);
  }, [albumToken, t]);

  useEffect(() => {
    void loadFeed({ showLoader: true });
  }, [loadFeed]);

  useEffect(() => {
    if (tab !== "feed" || !nameReady) return;

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        void loadFeed();
      }
    };

    const intervalId = window.setInterval(refreshIfVisible, 10_000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void loadFeed();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [tab, nameReady, loadFeed]);

  const backdropUrls = useMemo(() => {
    if (!feed) return [];
    return feed.items
      .filter((item) => !item.mimeType?.startsWith("video/"))
      .slice(0, 9)
      .map((item) => item.url);
  }, [feed]);

  const takenNames = useMemo(() => {
    const fromApi = feed?.takenNames ?? [];
    const fromItems = (feed?.items ?? [])
      .map((item) => item.uploadedBy?.trim())
      .filter((name): name is string => Boolean(name));
    return [...new Set([...fromApi, ...fromItems].map(normalizeName))];
  }, [feed]);

  function saveGuestName(e: FormEvent) {
    e.preventDefault();
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameError(t("albumNameRequired"));
      return;
    }

    const normalized = normalizeName(trimmed);
    const ownName = guestName ? normalizeName(guestName) : null;
    const isOwnName = ownName !== null && ownName === normalized;
    if (!isOwnName && takenNames.includes(normalized)) {
      setNameError(t("albumNameTaken"));
      return;
    }

    setNameError(null);
    nameInputRef.current?.blur();

    try {
      localStorage.setItem(GUEST_NAME_KEY(albumToken), trimmed);
    } catch {
      // ignore
    }
    setGuestName(trimmed);
    setNameReady(true);

    if (error || !feed) {
      void loadFeed({ showLoader: true });
    }
  }

  async function handleReact(mediaId: string, emoji: string) {
    if (!feed?.reactionsEnabled) return;

    const reactorKey = getOrCreateAlbumReactorKey();
    if (!reactorKey) return;

    const previouslySelected = myReactions[mediaId]?.includes(emoji) ?? false;
    setMyReactions((prev) => {
      const current = new Set(prev[mediaId] ?? []);
      if (current.has(emoji)) current.delete(emoji);
      else current.add(emoji);
      return { ...prev, [mediaId]: Array.from(current) };
    });
    setFeed((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item) => {
          if (item.id !== mediaId) return item;
          const nextCounts = { ...item.reactionCounts };
          const currentCount = nextCounts[emoji] ?? 0;
          nextCounts[emoji] = previouslySelected
            ? Math.max(0, currentCount - 1)
            : currentCount + 1;
          return { ...item, reactionCounts: nextCounts };
        }),
      };
    });

    try {
      const response = await fetch(`/api/public/album/${albumToken}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, emoji, reactorKey }),
      });
      if (!response.ok) {
        void loadFeed();
        return;
      }
      const json = (await response.json().catch(() => null)) as
        | { data?: { removed?: boolean } }
        | null;
      const removed = Boolean(json?.data?.removed);
      setMyReactions((prev) => {
        const current = new Set(prev[mediaId] ?? []);
        if (removed) current.delete(emoji);
        else current.add(emoji);
        return { ...prev, [mediaId]: Array.from(current) };
      });
      void loadFeed();
    } catch {
      void loadFeed();
    }
  }

  function startChallenge(challenge: ActiveChallenge) {
    setActiveChallenge(challenge);
    setStoryOpen(true);
  }

  function openCreate() {
    setStoryOpen(true);
  }

  function openMediaDetail(mediaId: string) {
    setActiveMediaId(mediaId);
    router.push(`/a/${albumToken}/m/${mediaId}`);
  }

  function closeMediaDetail() {
    setActiveMediaId(null);
    router.push(`/a/${albumToken}`);
  }

  function selectTab(next: AlbumTab) {
    setActiveMediaId(null);
    setTab(next);
    if (initialMediaId) {
      const qs = next !== "feed" ? `?tab=${next}` : "";
      router.push(`/a/${albumToken}${qs}`);
    }
  }

  useEffect(() => {
    if (autoOpenedStory.current) return;
    if ((uploadOnly || initialTab === "upload") && uploadToken && guestName && nameReady) {
      autoOpenedStory.current = true;
      setStoryOpen(true);
    }
  }, [uploadOnly, initialTab, uploadToken, guestName, nameReady]);

  useEffect(() => {
    if (!feed || !activeMediaId || loading || missingMediaHandled.current) return;
    const found = feed.items.some((item) => item.id === activeMediaId);
    if (!found) {
      missingMediaHandled.current = true;
      router.replace(`/a/${albumToken}`);
      setActiveMediaId(null);
    }
  }, [feed, activeMediaId, loading, albumToken, router]);

  if (!nameReady) {
    const welcomeEnabled = feed?.appearance?.welcomeScreenEnabled;
    const welcomeTitle = feed?.appearance?.welcomeScreenTitle;
    const welcomeMessage = feed?.appearance?.welcomeScreenMessage;
    const logoUrl = feed?.theme?.logoUrl;

    return (
      <AlbumBackdrop
        urls={backdropUrls}
        backgroundUrl={feed?.theme?.albumBackgroundUrl}
        themeColors={feed?.theme}
      >
        <div
          className="flex h-full items-center justify-center overflow-y-auto overscroll-none px-4 py-12"
          data-app-scroll
        >
          <form
            onSubmit={saveGuestName}
            className="w-full max-w-sm space-y-5 rounded-3xl border border-white/15 bg-black/45 p-6 text-white shadow-2xl backdrop-blur-xl"
          >
            <div className="space-y-2 text-center">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt=""
                  className="mx-auto mb-2 h-12 w-12 rounded-xl object-cover"
                />
              ) : null}
              {welcomeEnabled && welcomeTitle ? (
                <>
                  <h1 className="text-2xl font-semibold tracking-tight">{welcomeTitle}</h1>
                  {welcomeMessage ? (
                    <p className="text-sm text-white/70">{welcomeMessage}</p>
                  ) : null}
                  <p className="pt-2 text-xs font-medium uppercase tracking-[0.2em] text-white/55">
                    {feed?.eventName ?? t("albumWelcomeTitle")}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/55">
                    {t("albumTitle")}
                  </p>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {feed?.eventName ?? t("albumWelcomeTitle")}
                  </h1>
                  <p className="text-sm text-white/70">{t("albumNamePrompt")}</p>
                </>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-name" className="text-white/80">
                {t("albumYourName")}
              </Label>
              <Input
                ref={nameInputRef}
                id="guest-name"
                value={nameDraft}
                onChange={(e) => {
                  setNameDraft(e.target.value);
                  if (nameError) setNameError(null);
                }}
                onInput={(e) => {
                  const value = (e.target as HTMLInputElement).value;
                  setNameDraft(value);
                  if (nameError) setNameError(null);
                }}
                placeholder={t("albumNamePlaceholder")}
                className="h-11 border-white/20 bg-white/10 text-base text-white placeholder:text-white/40"
                autoComplete="nickname"
                enterKeyHint="done"
                maxLength={40}
                inputMode="text"
              />
              {nameError ? (
                <p className="text-sm text-red-300" role="alert">
                  {nameError}
                </p>
              ) : null}
            </div>
            <Button
              type="submit"
              variant="default"
              className="h-11 w-full"
              disabled={!nameDraft.trim()}
            >
              {t("albumJoinCta")}
            </Button>
            {feed?.appearance?.removeBranding ? null : (
              <p className="text-center text-[11px] text-white/40">{t("poweredBy")}</p>
            )}
          </form>
        </div>
      </AlbumBackdrop>
    );
  }

  if (loading) {
    return (
      <AlbumBackdrop urls={[]}>
        <AlbumAppShellSkeleton />
      </AlbumBackdrop>
    );
  }

  if (error || !feed) {
    return (
      <AlbumBackdrop urls={[]}>
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-white/70">
          {error ?? t("albumLoadError")}
        </div>
      </AlbumBackdrop>
    );
  }

  if (feed.panic) {
    return (
      <div className="flex h-dvh items-center justify-center bg-black px-6 text-center">
        <div className="space-y-2">
          <p className="text-sm font-medium tracking-wide text-white/80">{t("wallPanic")}</p>
          <p className="text-xs text-white/40">{t("wallPanicDesc")}</p>
        </div>
      </div>
    );
  }

  const showUpload = Boolean(feed.canUpload && uploadToken);
  const showWishes = !uploadOnly && feed.enableVoiceWishes !== false;
  const showMusic = !uploadOnly && feed.enableSongRequests !== false;
  const primaryColor = feed.theme?.primaryColor;
  const logoUrl = feed.theme?.logoUrl;
  const watermarkUrl = feed.branding?.watermarkUrl ?? null;
  const removeBranding = feed.appearance?.removeBranding === true;
  const brandingEnabled = !removeBranding;
  const brandSrc = logoUrl || watermarkUrl || null;
  const viewingDetail = Boolean(activeMediaId) && !uploadOnly;
  const detailItem =
    viewingDetail && activeMediaId
      ? (feed.items.find((item) => item.id === activeMediaId) ?? null)
      : null;
  const hideChromeHeader = tab === "feed" && !viewingDetail && !uploadOnly;

  return (
    <AlbumBackdrop
      urls={backdropUrls}
      backgroundUrl={feed.theme?.albumBackgroundUrl}
      themeColors={feed.theme}
    >
      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-lg flex-col overflow-hidden bg-neutral-950/80 md:bg-neutral-950/90">
        {hideChromeHeader ? null : (
          <header
            className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-neutral-950/90 backdrop-blur-xl"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div
              className={cn(
                "mx-auto flex h-14 w-full max-w-lg items-center px-4",
                viewingDetail ? "gap-2" : brandingEnabled ? "justify-center" : "gap-3",
              )}
            >
              {viewingDetail ? (
                <>
                  <button
                    type="button"
                    onClick={closeMediaDetail}
                    className="tap-press flex size-10 items-center justify-center rounded-full text-white active:bg-white/10"
                    aria-label={t("albumBack")}
                  >
                    <ChevronLeft className="size-6" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {detailItem?.uploadedBy
                        ? `@${detailItem.uploadedBy}`
                        : t("albumTitle")}
                    </p>
                  </div>
                </>
              ) : brandingEnabled ? (
                brandSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brandSrc}
                    alt=""
                    className="h-8 max-w-[10rem] object-contain"
                  />
                ) : (
                  <Logo
                    variant="full"
                    theme="light"
                    size="sm"
                    className="h-7 w-auto"
                    priority
                  />
                )
              ) : (
                <>
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-lg object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <h1 className="truncate text-base font-semibold tracking-tight text-white">
                      {feed.eventName}
                    </h1>
                    {guestName ? (
                      <p className="truncate text-xs text-white/55">@{guestName}</p>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </header>
        )}

        <main
          ref={mainRef}
          tabIndex={-1}
          data-app-scroll
          className={cn(
            "flex min-h-0 flex-1 flex-col overscroll-none outline-none",
            uploadOnly || tab === "upload" ? "overflow-hidden" : "overflow-y-auto",
          )}
          style={{
            paddingTop: hideChromeHeader
              ? "env(safe-area-inset-top)"
              : "calc(3.5rem + env(safe-area-inset-top))",
            paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))",
          }}
        >
          {viewingDetail ? (
            detailItem ? (
              <AlbumMediaDetail
                item={detailItem}
                games={feed.games}
                reactionsEnabled={feed.reactionsEnabled}
                disableGuestDownload={feed.disableGuestDownload}
                myEmojis={myReactions[detailItem.id] ?? []}
                onReact={handleReact}
              />
            ) : (
              <div className="px-6 py-24 text-center text-sm text-white/70">
                {t("albumLoading")}
              </div>
            )
          ) : uploadOnly || tab === "upload" ? (
            showUpload && uploadToken ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-base font-medium text-white">{t("albumNavUpload")}</p>
                <p className="max-w-xs text-sm text-white/60">{t("albumEmptyDesc")}</p>
                <Button
                  type="button"
                  className="h-11 gap-1.5 px-6"
                  style={
                    primaryColor
                      ? { backgroundColor: primaryColor, color: "#0f0f12" }
                      : undefined
                  }
                  onClick={openCreate}
                >
                  <Camera className="size-4" />
                  {t("albumNavUpload")}
                </Button>
              </div>
            ) : (
              <div className="px-6 py-24 text-center text-sm text-white/70">
                {t("albumUploadDisabled")}
              </div>
            )
          ) : tab === "feed" ? (
            <AlbumFeedGrid
              eventName={feed.eventName}
              coverUrl={feed.theme?.albumBackgroundUrl}
              primaryColor={primaryColor}
              items={feed.items}
              showUpload={showUpload}
              onUpload={openCreate}
              onOpenItem={openMediaDetail}
            />
          ) : tab === "games" ? (
            <div className="flex flex-col">
              <div className="px-4 py-5">
                <h2 className="text-lg font-semibold text-white">{t("albumGamesTitle")}</h2>
                <p className="mt-1 text-sm text-white/60">{t("albumGamesDesc")}</p>
              </div>
              <ul className="divide-y divide-white/10">
                {(feed.games && feed.games.length > 0
                  ? feed.games.map((game) => ({
                      id: game.presetKey || game.id,
                      mode: resolveGameMode(game),
                      title: game.title,
                      desc: game.description ?? "",
                      image:
                        game.coverImage ||
                        (game.presetKey &&
                          ALBUM_CHALLENGES.find((c) => c.id === game.presetKey)
                            ?.image) ||
                        "/album/challenges/group-selfie.png",
                    }))
                  : ALBUM_CHALLENGES.map((challenge) => ({
                      id: challenge.id,
                      mode: (challenge.collage ? "collage" : "photo") as EventGameMode,
                      title: t(`albumChallenge.${challenge.id}.title`),
                      desc: t(`albumChallenge.${challenge.id}.desc`),
                      image: challenge.image,
                    }))
                ).map((challenge) => (
                  <li key={challenge.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!showUpload) return;
                        startChallenge({
                          id: challenge.id,
                          mode: challenge.mode,
                          title: challenge.title,
                          coverImage: challenge.image,
                        });
                      }}
                      disabled={!showUpload}
                      className="tap-press flex w-full items-center gap-3 px-4 py-4 text-left active:bg-white/5 disabled:opacity-50"
                    >
                      <span
                        className="relative size-12 shrink-0 overflow-hidden rounded-2xl bg-black"
                        aria-hidden
                      >
                        <Image
                          src={challenge.image}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">{challenge.title}</p>
                        <p className="mt-0.5 text-sm text-white/55">{challenge.desc}</p>
                      </div>
                      <span className="text-sm font-medium text-amber-300">
                        {showUpload ? t("albumPlayChallenge") : t("albumUploadDisabled")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : tab === "wishes" && guestName ? (
            <VoiceWishRecorder albumToken={albumToken} guestName={guestName} />
          ) : tab === "music" && guestName ? (
            <AlbumSongRequestPanel albumToken={albumToken} guestName={guestName} />
          ) : (
            <div className="px-6 py-24 text-center text-sm text-white/70">
              {t("albumUploadDisabled")}
            </div>
          )}
        </main>

        {feed.appearance?.removeBranding ? null : (
          <p className="pointer-events-none absolute bottom-[4.75rem] left-0 right-0 z-20 text-center text-[10px] text-white/35">
            {t("poweredBy")}
          </p>
        )}

        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-neutral-950/90 backdrop-blur-xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto flex h-16 max-w-lg items-stretch">
            {uploadOnly ? (
              <button
                type="button"
                onClick={openCreate}
                className="tap-press flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-white transition"
              >
                <Camera className="size-5" />
                {t("albumNavUpload")}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => selectTab("feed")}
                  className={cn(
                    "tap-press flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition",
                    tab === "feed" && !viewingDetail
                      ? "text-white"
                      : "text-white/45 active:text-white/75",
                  )}
                >
                  <Images className="size-5" />
                  {t("albumNavFeed")}
                </button>
                <button
                  type="button"
                  onClick={() => selectTab("games")}
                  className={cn(
                    "tap-press flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition",
                    tab === "games" ? "text-white" : "text-white/45 active:text-white/75",
                  )}
                >
                  <Gamepad2 className="size-5" />
                  {t("albumNavGames")}
                </button>
                {showWishes ? (
                  <button
                    type="button"
                    onClick={() => selectTab("wishes")}
                    className={cn(
                      "tap-press flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition",
                      tab === "wishes" ? "text-white" : "text-white/45 active:text-white/75",
                    )}
                  >
                    <Mic className="size-5" />
                    {t("albumNavWishes")}
                  </button>
                ) : null}
                {showMusic ? (
                  <button
                    type="button"
                    onClick={() => selectTab("music")}
                    className={cn(
                      "tap-press flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition",
                      tab === "music" ? "text-white" : "text-white/45 active:text-white/75",
                    )}
                  >
                    <Music2 className="size-5" />
                    {t("albumNavMusic")}
                  </button>
                ) : null}
                {showUpload ? (
                  <button
                    type="button"
                    onClick={() => {
                      selectTab("upload");
                      openCreate();
                    }}
                    className={cn(
                      "tap-press flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition",
                      tab === "upload" || storyOpen
                        ? "text-white"
                        : "text-white/45 active:text-white/75",
                    )}
                  >
                    <Camera className="size-5" />
                    {t("albumNavUpload")}
                  </button>
                ) : null}
              </>
            )}
          </div>
        </nav>
      </div>

      {storyOpen && uploadToken && guestName ? (
        <StoryStudio
          uploadToken={uploadToken}
          eventName={feed.eventName}
          guestName={guestName}
          primaryColor={primaryColor}
          allowVideos={feed.allowVideos !== false}
          onClose={() => {
            setStoryOpen(false);
            setActiveChallenge(null);
            if (!uploadOnly) setTab("feed");
          }}
          onPublished={() => {
            setActiveChallenge(null);
            void loadFeed();
            if (!uploadOnly) setTab("feed");
          }}
        />
      ) : null}
    </AlbumBackdrop>
  );
}

function AlbumBackdrop({
  urls,
  backgroundUrl,
  themeColors,
  children,
}: {
  urls: string[];
  backgroundUrl?: string | null;
  themeColors?: EventThemeColors;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 h-dvh overflow-hidden overscroll-none bg-neutral-950 text-white"
      style={themeColors ? eventThemeStyle(themeColors) : undefined}
    >
      <MobileAppLock />
      <div className="pointer-events-none absolute inset-0 md:block">
        {backgroundUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={backgroundUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            aria-hidden
          />
        ) : urls.length > 0 ? (
          <div className="absolute inset-0 hidden opacity-30 md:grid md:grid-cols-3 md:gap-1">
            {Array.from({ length: 9 }).map((_, index) => {
              const url = urls[index % urls.length];
              return (
                <div key={`${url}-${index}`} className="relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="h-full min-h-[18vh] w-full scale-110 object-cover blur-2xl"
                    aria-hidden
                  />
                </div>
              );
            })}
          </div>
        ) : null}
        <div className="absolute inset-0 bg-neutral-950 md:bg-black/70" />
      </div>
      {children}
    </div>
  );
}

function AlbumFeedGrid({
  eventName,
  coverUrl,
  primaryColor,
  items,
  showUpload,
  onUpload,
  onOpenItem,
}: {
  eventName: string;
  coverUrl?: string | null;
  primaryColor?: string;
  items: AlbumFeedItem[];
  showUpload: boolean;
  onUpload: () => void;
  onOpenItem: (id: string) => void;
}) {
  const t = useTranslations("publicEvent");
  const heroUrl =
    coverUrl ||
    items.find((item) => !item.mimeType?.startsWith("video/"))?.url ||
    items.find((item) => item.thumbnailUrl)?.thumbnailUrl ||
    null;

  return (
    <div className="flex flex-col">
      <section className="relative isolate min-h-[42vh] overflow-hidden">
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: primaryColor
                ? `linear-gradient(160deg, ${primaryColor}, #0f0f12)`
                : "linear-gradient(160deg, #3f3f46, #0f0f12)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/55 to-black/25" />
        <div className="relative flex min-h-[42vh] flex-col justify-end gap-3 px-5 pb-6 pt-16">
          <h1 className="max-w-[16ch] text-3xl font-semibold leading-tight tracking-tight text-white">
            {eventName}
          </h1>
          {showUpload ? (
            <Button
              type="button"
              className="h-11 w-fit gap-2 px-5 font-semibold text-neutral-950"
              style={
                primaryColor ? { backgroundColor: primaryColor } : undefined
              }
              onClick={onUpload}
            >
              <Camera className="size-4" />
              {t("albumUploadPhotos")}
            </Button>
          ) : null}
          <p className="text-sm text-white/75">
            {t("albumPhotosCollected", { count: items.length })}
          </p>
        </div>
      </section>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center text-white">
          <p className="text-lg font-medium">{t("albumEmpty")}</p>
          <p className="max-w-sm text-sm text-white/65">{t("albumEmptyDesc")}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-3 gap-1.5 p-1.5">
          {items.map((item) => {
            const isVideo = item.mimeType?.startsWith("video/");
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onOpenItem(item.id)}
                  className="tap-press relative aspect-square w-full overflow-hidden rounded-xl bg-white/5"
                  aria-label={item.caption || item.uploadedBy || t("albumTitle")}
                >
                  {isVideo ? (
                    item.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video
                        src={item.url}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                    )
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                  {isVideo ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <span className="flex size-9 items-center justify-center rounded-full bg-white/90 text-neutral-950">
                        <Play className="size-4 fill-current" />
                      </span>
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AlbumMediaDetail({
  item,
  games,
  reactionsEnabled,
  disableGuestDownload,
  myEmojis,
  onReact,
}: {
  item: AlbumFeedItem;
  games?: AlbumFeedGame[];
  reactionsEnabled: boolean;
  disableGuestDownload: boolean;
  myEmojis: string[];
  onReact: (mediaId: string, emoji: string) => void;
}) {
  const t = useTranslations("publicEvent");
  const isVideo = item.mimeType?.startsWith("video/");
  const gameMatch = item.challengeId
    ? games?.find(
        (game) =>
          game.presetKey === item.challengeId || game.id === item.challengeId,
      )
    : null;
  const challengeLabel = gameMatch
    ? gameMatch.title
    : item.challengeId && isAlbumChallengeId(item.challengeId)
      ? t(`albumChallenge.${item.challengeId}.title`)
      : null;
  const selected = new Set(myEmojis);

  return (
    <div className="flex flex-col">
      <div className="relative w-full bg-black">
        {isVideo ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            src={item.url}
            poster={item.thumbnailUrl ?? undefined}
            className="h-auto max-h-[70vh] w-full object-contain"
            controls
            playsInline
            controlsList={disableGuestDownload ? "nodownload" : undefined}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url}
            alt={item.caption ?? ""}
            className={cn(
              "h-auto max-h-[70vh] w-full object-contain",
              disableGuestDownload && "pointer-events-none select-none",
            )}
            draggable={!disableGuestDownload}
          />
        )}
      </div>

      <div className="space-y-3 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/80">
            {(item.uploadedBy ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {item.uploadedBy ? `@${item.uploadedBy}` : "guest"}
            </p>
            {challengeLabel ? (
              <p className="truncate text-xs text-amber-300/90">{challengeLabel}</p>
            ) : null}
          </div>
        </div>

        {reactionsEnabled ? (
          <div className="flex flex-wrap items-center gap-0.5">
            {WALL_REACTION_EMOJIS.map((emoji) => {
              const count = item.reactionCounts[emoji] ?? 0;
              const isMine = selected.has(emoji);
              return (
                <button
                  key={emoji}
                  type="button"
                  className={cn(
                    "tap-press inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-full px-2 text-base transition-colors",
                    isMine ? "bg-white/15 ring-1 ring-white/30" : "active:bg-white/10",
                  )}
                  onClick={() => onReact(item.id, emoji)}
                  aria-label={emoji}
                  aria-pressed={isMine}
                >
                  <span>{emoji}</span>
                  {count > 0 ? (
                    <span className="text-xs font-medium text-white/55">{count}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {item.caption ? (
          <p className="text-sm leading-relaxed text-white/90">
            {item.uploadedBy ? (
              <span className="mr-1.5 font-semibold text-white">@{item.uploadedBy}</span>
            ) : null}
            {item.caption}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** @deprecated Use PublicAlbumShell */
export const PublicAlbumFeed = PublicAlbumShell;
