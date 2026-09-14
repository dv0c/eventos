"use client";

import { MediaStatus } from "@prisma/client";
import {
  Check,
  Download,
  EyeOff,
  Lock,
  Music2,
  ShieldAlert,
  Smartphone,
  Trash2,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { SongRequestsPanel } from "@/components/media/song-requests-panel";
import { MediaUploadModal } from "@/components/media/media-upload-modal";
import { useOrg, useOrgPath } from "@/components/providers/org-provider";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { EventLifecycle } from "@/server/events/event-ended";

type MediaFilter = "published" | "pending" | "hidden" | "wishes";

interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  fileName: string | null;
  mimeType: string;
  status: MediaStatus;
  caption: string | null;
  createdAt: string;
  isFeatured?: boolean;
}

interface WishItem {
  id: string;
  url: string;
  mimeType: string;
  fileName: string;
  durationMs: number;
  uploadedBy: string | null;
  createdAt: string;
}

interface EventMediaManagerProps {
  eventId: string;
  eventSlug: string;
  albumHref: string | null;
  lifecycle?: EventLifecycle;
  mediaPurgeAt?: string | null;
  isPremium?: boolean;
}

const FREE_UPLOAD_CAP = 100;

export function EventMediaManager({
  eventId,
  eventSlug,
  albumHref,
  lifecycle = "active",
  mediaPurgeAt = null,
  isPremium = false,
}: EventMediaManagerProps) {
  const t = useTranslations("eventWorkspace.media");
  const tWishes = useTranslations("eventWorkspace.voiceWishes");
  const tMod = useTranslations("moderatorAlbum");
  const orgPath = useOrgPath();
  const { planName } = useOrg();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [wishItems, setWishItems] = useState<WishItem[]>([]);
  const [wishCount, setWishCount] = useState(0);
  const [wishesUnlocked, setWishesUnlocked] = useState(false);
  const [wishesLoading, setWishesLoading] = useState(true);
  const [deletingWishId, setDeletingWishId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [filter, setFilter] = useState<MediaFilter>("published");
  const [sortNewest, setSortNewest] = useState(true);
  const [panic, setPanic] = useState(false);
  const [panicBusy, setPanicBusy] = useState(false);

  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/media`);
      if (!response.ok) {
        toast.error(t("loadError"));
        setIsLoading(false);
        return;
      }
      const json = await response.json();
      setItems(json.data.media ?? []);
    } catch {
      toast.error(t("loadError"));
    }
    setIsLoading(false);
  }, [eventId, t]);

  const loadWishes = useCallback(async () => {
    setWishesLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/wishes`);
      if (!response.ok) {
        toast.error(tWishes("loadError"));
        setWishesLoading(false);
        return;
      }
      const json = await response.json();
      const isUnlocked = Boolean(json.data.unlocked);
      setWishCount(json.data.count ?? 0);
      setWishesUnlocked(isUnlocked);
      setWishItems(isUnlocked ? (json.data.items ?? []) : []);
    } catch {
      toast.error(tWishes("loadError"));
    }
    setWishesLoading(false);
  }, [eventId, tWishes]);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  useEffect(() => {
    void loadWishes();
  }, [loadWishes]);

  useEffect(() => {
    async function loadPanic() {
      try {
        const response = await fetch(`/api/events/${eventId}/panic`);
        if (!response.ok) return;
        const json = await response.json();
        setPanic(Boolean(json.data?.panic));
      } catch {
        // optional
      }
    }
    void loadPanic();
  }, [eventId]);

  async function togglePanic() {
    const next = !panic;
    if (next && !window.confirm(tMod("panicConfirm"))) return;
    setPanicBusy(true);
    try {
      const response = await fetch(`/api/events/${eventId}/panic`, {
        method: next ? "POST" : "DELETE",
      });
      if (!response.ok) {
        toast.error(tMod("panicError"));
        setPanicBusy(false);
        return;
      }
      setPanic(next);
      toast.success(next ? tMod("panicArmed") : tMod("panicCleared"));
    } catch {
      toast.error(tMod("panicError"));
    }
    setPanicBusy(false);
  }

  const retentionLabel = useMemo(() => {
    if (lifecycle !== "ended" || !mediaPurgeAt) return null;
    const purgeMs = new Date(mediaPurgeAt).getTime();
    if (!Number.isFinite(purgeMs)) return null;
    const daysLeft = Math.max(0, Math.ceil((purgeMs - Date.now()) / (24 * 60 * 60 * 1000)));
    return t("retentionCountdown", { days: daysLeft });
  }, [lifecycle, mediaPurgeAt, t]);

  const counts = useMemo(() => {
    const published = items.filter(
      (item) => item.status === MediaStatus.APPROVED || item.status === MediaStatus.FEATURED,
    ).length;
    const pending = items.filter((item) => item.status === MediaStatus.PENDING).length;
    const hidden = items.filter((item) => item.status === MediaStatus.REJECTED).length;
    return { published, pending, hidden, total: items.length };
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === "wishes") return [];
    let list = items.filter((item) => {
      if (filter === "published") {
        return item.status === MediaStatus.APPROVED || item.status === MediaStatus.FEATURED;
      }
      if (filter === "pending") return item.status === MediaStatus.PENDING;
      return item.status === MediaStatus.REJECTED;
    });
    list = [...list].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortNewest ? -diff : diff;
    });
    return list;
  }, [items, filter, sortNewest]);

  const sortedWishes = useMemo(() => {
    return [...wishItems].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortNewest ? -diff : diff;
    });
  }, [wishItems, sortNewest]);

  const uploadLimit = isPremium
    ? Math.max(FREE_UPLOAD_CAP * 10, counts.total)
    : FREE_UPLOAD_CAP;
  const usedPct = Math.min(100, Math.round((counts.total / uploadLimit) * 100));

  async function moderate(mediaId: string, action: "approve" | "reject" | "feature") {
    try {
      const response = await fetch(`/api/events/${eventId}/media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, action }),
      });
      if (!response.ok) {
        toast.error(t("moderateError"));
        return;
      }
      toast.success(t("moderateSuccess"));
      await loadMedia();
    } catch {
      toast.error(t("moderateError"));
    }
  }

  async function handleDelete(mediaId: string) {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      const response = await fetch(`/api/events/${eventId}/media/${mediaId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error(t("deleteError"));
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== mediaId));
      toast.success(t("deleteSuccess"));
    } catch {
      toast.error(t("deleteError"));
    }
  }

  async function handleDeleteWish(wishId: string) {
    setDeletingWishId(wishId);
    try {
      const response = await fetch(`/api/events/${eventId}/wishes/${wishId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error(tWishes("deleteError"));
        setDeletingWishId(null);
        return;
      }
      toast.success(tWishes("deleteSuccess"));
      await loadWishes();
    } catch {
      toast.error(tWishes("deleteError"));
    }
    setDeletingWishId(null);
  }

  const filters: { id: MediaFilter; label: string; count: number }[] = [
    { id: "published", label: t("published"), count: counts.published },
    { id: "pending", label: t("needApproval"), count: counts.pending },
    { id: "hidden", label: t("hidden"), count: counts.hidden },
    { id: "wishes", label: t("wishes"), count: wishCount },
  ];

  const showingWishes = filter === "wishes";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.rich("description", {
              wall: (chunks) => (
                <Link
                  href={`/e/${eventSlug}/wall`}
                  target="_blank"
                  className="font-medium text-primary hover:underline"
                >
                  {chunks}
                </Link>
              ),
              album: (chunks) =>
                albumHref ? (
                  <Link
                    href={albumHref}
                    target="_blank"
                    className="font-medium text-primary hover:underline"
                  >
                    {chunks}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">{chunks}</span>
                ),
            })}
          </p>
          {!albumHref ? (
            <p className="text-sm text-muted-foreground">
              {lifecycle === "waiting" ? t("albumWaiting") : t("albumClosed")}
            </p>
          ) : null}
          {retentionLabel ? (
            <p className="text-sm text-amber-700 dark:text-amber-400">{retentionLabel}</p>
          ) : null}
          {lifecycle === "ended" ? (
            <p className="text-sm text-muted-foreground">{t("downloadAfterEndHint")}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="icon"
            className="size-9"
            onClick={() => setUploadOpen(true)}
            aria-label={t("uploadPhotos")}
            title={t("uploadPhotos")}
          >
            <Upload className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-9 bg-background"
            asChild
          >
            <Link
              href={`/mod/${eventId}`}
              aria-label={tMod("openModeratorApp")}
              title={tMod("openModeratorApp")}
            >
              <Smartphone className="size-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-9 bg-background"
            asChild
          >
            <Link
              href={`/mod/${eventId}/dj`}
              aria-label={t("openDjBooth")}
              title={t("openDjBooth")}
            >
              <Music2 className="size-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "size-9 bg-background",
              panic && "border-destructive/50 text-destructive",
            )}
            disabled={panicBusy}
            onClick={() => void togglePanic()}
            aria-label={panic ? tMod("panicClear") : tMod("panicArm")}
            title={panic ? tMod("panicClear") : tMod("panicArm")}
          >
            <ShieldAlert className="size-4" />
          </Button>
          <Button
            variant="outline"
            size={lifecycle === "ended" ? "default" : "icon"}
            className={
              lifecycle === "ended"
                ? "h-9 gap-2 bg-background px-3"
                : "size-9 bg-background"
            }
            onClick={() => {
              window.location.href = `/api/events/${eventId}/media/download`;
            }}
            aria-label={t("downloadAll")}
            title={t("downloadAll")}
          >
            <Download className="size-4" />
            {lifecycle === "ended" ? (
              <span className="text-sm font-medium">{t("downloadZip")}</span>
            ) : null}
          </Button>
        </div>
      </header>

      <MediaUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title={t("uploadPhotos")}
        mode="multiple"
        accept="image/jpeg,image/png,image/webp,image/gif"
        upload={{
          url: `/api/events/${eventId}/media`,
          buildFormData: (file) => {
            const formData = new FormData();
            formData.append("file", file);
            return formData;
          },
        }}
        onSuccess={async ({ files }) => {
          for (const entry of files) {
            const media = (
              entry.response as {
                data?: {
                  media?: {
                    id: string;
                    url: string;
                    fileName: string | null;
                    mimeType: string;
                    status: MediaStatus;
                    caption: string | null;
                    createdAt: string;
                  };
                };
              }
            )?.data?.media;
            if (!media?.id) continue;
            setItems((prev) => [
              {
                id: media.id,
                url: media.url,
                fileName: media.fileName,
                mimeType: media.mimeType,
                status: media.status,
                caption: media.caption,
                createdAt: media.createdAt,
              },
              ...prev.filter((item) => item.id !== media.id),
            ]);
          }
          if (filter !== "published") setFilter("published");
          await loadMedia();
        }}
      />

      <section className="dashboard-surface flex flex-wrap items-center gap-4 p-4 sm:p-5">
        <div
          className="relative flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(var(--primary) ${usedPct}%, var(--border) 0)`,
          }}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-xs font-semibold">
            {usedPct}%
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {t("uploadLimit", { plan: planName })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("uploadsUsed", { used: counts.total, limit: uploadLimit })}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={orgPath("/billing")}>{t("getMore")}</Link>
        </Button>
      </section>

      <SongRequestsPanel eventId={eventId} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                filter === item.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>
        <button
          type="button"
          className="text-sm font-medium text-primary hover:underline"
          onClick={() => setSortNewest((value) => !value)}
        >
          {t("sortBy")}: {sortNewest ? t("dateAdded") : t("dateOldest")}
        </button>
      </div>

      {showingWishes ? (
        wishesLoading ? (
          <div
            className="grid gap-3 sm:grid-cols-2 md:grid-cols-3"
            role="status"
            aria-label={tWishes("loading")}
          >
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-xl border border-border/60 bg-card p-3 shadow-sm"
              >
                <div className="mb-3 h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="aspect-video animate-pulse rounded-lg bg-muted" />
              </div>
            ))}
          </div>
        ) : !wishesUnlocked ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 px-6 py-16 text-center">
            <p className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <Lock className="size-3.5 shrink-0" />
              {tWishes("sealedCount", { count: wishCount })}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{tWishes("sealedHint")}</p>
          </div>
        ) : sortedWishes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">{tWishes("empty")}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {sortedWishes.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-xl border border-border/60 bg-card p-3 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.uploadedBy ?? tWishes("anonymous")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tWishes("duration", {
                        seconds: Math.round(item.durationMs / 1000),
                      })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={deletingWishId === item.id}
                    onClick={() => void handleDeleteWish(item.id)}
                    aria-label={tWishes("delete")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                {item.mimeType.startsWith("video/") ? (
                  <video
                    src={item.url}
                    controls
                    playsInline
                    className="w-full rounded-lg"
                    preload="metadata"
                  />
                ) : (
                  <audio
                    src={item.url}
                    controls
                    className="w-full"
                    preload="metadata"
                  />
                )}
              </article>
            ))}
          </div>
        )
      ) : isLoading ? (
        <div
          className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          role="status"
          aria-label={t("loading")}
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
            >
              <div className="aspect-square animate-pulse bg-muted" />
              <div className="flex gap-1 p-2">
                <div className="h-8 flex-1 animate-pulse rounded-md bg-muted" />
                <div className="h-8 flex-1 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
            >
              <div className="relative aspect-square bg-muted">
                {item.mimeType?.startsWith("video/") ? (
                  item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnailUrl}
                      alt={item.caption ?? item.fileName ?? ""}
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
                    alt={item.caption ?? item.fileName ?? ""}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-1 p-2">
                {item.status === MediaStatus.PENDING ? (
                  <Button size="sm" variant="outline" className="h-8 flex-1 gap-1" onClick={() => void moderate(item.id, "approve")}>
                    <Check className="h-3.5 w-3.5" />
                    {t("approve")}
                  </Button>
                ) : null}
                {item.status !== MediaStatus.REJECTED ? (
                  <Button size="sm" variant="ghost" className="h-8 flex-1 gap-1" onClick={() => void moderate(item.id, "reject")}>
                    <EyeOff className="h-3.5 w-3.5" />
                    {t("hide")}
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="h-8 flex-1 gap-1" onClick={() => void moderate(item.id, "approve")}>
                    <Check className="h-3.5 w-3.5" />
                    {t("publish")}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => void handleDelete(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("delete")}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

    </div>
  );
}
