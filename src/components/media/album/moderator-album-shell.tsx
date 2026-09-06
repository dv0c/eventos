"use client";

import { MediaStatus } from "@prisma/client";
import {
  Check,
  Inbox,
  Images,
  MoreHorizontal,
  Bell,
  Star,
  Trash2,
  X,
  ExternalLink,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  focusAppScroll,
  MobileAppLock,
} from "@/components/media/album/mobile-app-lock";
import {
  ModFeedListSkeleton,
  WishCountSkeleton,
} from "@/components/media/album/album-app-skeletons";
import { useOrgPath } from "@/components/providers/org-provider";
import { GuestNotifyForm } from "@/components/media/guest-notify-form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Link } from "@/i18n/navigation";
import type { AlbumPermission } from "@/server/events/wall-settings";
import { cn } from "@/lib/utils";

type ModTab = "inbox" | "album" | "notify" | "more";

interface ModMediaItem {
  id: string;
  url: string;
  mimeType: string;
  status: MediaStatus;
  caption: string | null;
  uploadedBy?: string | null;
  createdAt: string;
  isFeatured?: boolean;
  challengeId?: string | null;
}

interface ModeratorSettings {
  requireManualApproval: boolean;
  disableLikes: boolean;
  albumPermission: AlbumPermission;
}

interface ModeratorAlbumShellProps {
  eventId: string;
  eventName: string;
  orgSlug: string;
  initialSettings: ModeratorSettings;
}

export function ModeratorAlbumShell({
  eventId,
  eventName,
  orgSlug,
  initialSettings,
}: ModeratorAlbumShellProps) {
  const t = useTranslations("moderatorAlbum");
  const orgPath = useOrgPath;
  const [tab, setTab] = useState<ModTab>("inbox");
  const [items, setItems] = useState<ModMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [settings, setSettings] = useState(initialSettings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [moderationQr, setModerationQr] = useState<{
    imageUrl: string;
    url: string;
  } | null>(null);
  const [wishCount, setWishCount] = useState<number | null>(null);
  const [wishesUnlocked, setWishesUnlocked] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => focusAppScroll(mainRef.current));
    return () => cancelAnimationFrame(id);
  }, [tab]);

  const loadMedia = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/media`);
      if (!response.ok) {
        toast.error(t("loadError"));
        setLoading(false);
        return;
      }
      const json = await response.json();
      setItems((json.data.media ?? []) as ModMediaItem[]);
    } catch {
      toast.error(t("loadError"));
    }
    setLoading(false);
  }, [eventId, t]);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  useEffect(() => {
    async function loadWishSummary() {
      try {
        const response = await fetch(`/api/events/${eventId}/wishes?summary=1`);
        if (!response.ok) return;
        const json = await response.json();
        setWishCount(typeof json.data?.count === "number" ? json.data.count : 0);
        setWishesUnlocked(Boolean(json.data?.unlocked));
      } catch {
        // ignore
      }
    }
    void loadWishSummary();
  }, [eventId]);

  useEffect(() => {
    async function loadModerationQr() {
      try {
        const response = await fetch(`/api/events/${eventId}/qr`);
        if (!response.ok) return;
        const json = await response.json();
        const codes = (json.data?.qrCodes ?? []) as {
          type: string;
          imageUrl?: string;
          url: string;
        }[];
        const mod = codes.find((code) => code.type === "MODERATION");
        if (mod?.imageUrl) {
          setModerationQr({ imageUrl: mod.imageUrl, url: mod.url });
        }
      } catch {
        // optional
      }
    }
    void loadModerationQr();
  }, [eventId]);

  const pending = useMemo(
    () => items.filter((item) => item.status === MediaStatus.PENDING),
    [items],
  );
  const published = useMemo(
    () =>
      items.filter(
        (item) =>
          item.status === MediaStatus.APPROVED ||
          item.status === MediaStatus.FEATURED,
      ),
    [items],
  );

  async function moderate(mediaId: string, action: "approve" | "reject" | "feature") {
    setBusyId(mediaId);
    try {
      const response = await fetch(`/api/events/${eventId}/media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, action }),
      });
      if (!response.ok) {
        toast.error(t("actionError"));
        setBusyId(null);
        return;
      }
      toast.success(t(`action.${action}`));
      await loadMedia();
    } catch {
      toast.error(t("actionError"));
    }
    setBusyId(null);
  }

  async function deleteMedia(mediaId: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    setBusyId(mediaId);
    try {
      const response = await fetch(`/api/events/${eventId}/media/${mediaId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error(t("actionError"));
        setBusyId(null);
        return;
      }
      toast.success(t("action.delete"));
      setItems((prev) => prev.filter((item) => item.id !== mediaId));
    } catch {
      toast.error(t("actionError"));
    }
    setBusyId(null);
  }

  async function patchSettings(patch: Partial<ModeratorSettings>) {
    const previous = settings;
    const next = { ...settings, ...patch };
    setSettings(next);
    setSavingSettings(true);
    try {
      const body: Record<string, unknown> = {
        moderation: {
          requireManualApproval: next.requireManualApproval,
          disableLikes: next.disableLikes,
          albumPermission: next.albumPermission,
        },
      };
      if (patch.requireManualApproval !== undefined) {
        body.requireManualApproval = patch.requireManualApproval;
      }
      const response = await fetch(`/api/events/${eventId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setSettings(previous);
        toast.error(t("settingsError"));
        setSavingSettings(false);
        return;
      }
      toast.success(t("settingsSaved"));
    } catch {
      setSettings(previous);
      toast.error(t("settingsError"));
    }
    setSavingSettings(false);
  }

  const feedItems = tab === "inbox" ? pending : tab === "album" ? published : [];

  return (
    <div className="fixed inset-0 overflow-hidden overscroll-none bg-neutral-950 text-white">
      <MobileAppLock />
      <div className="mx-auto flex h-dvh w-full max-w-lg flex-col overflow-hidden">
        <header
          className="sticky top-0 z-20 shrink-0 bg-neutral-950/90 backdrop-blur-xl"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="flex h-14 items-center gap-3 px-4">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold tracking-tight">
                {eventName}
              </h1>
              <p className="truncate text-xs text-white/55">
                {t("subtitle")}
                {pending.length > 0 ? (
                  <span className="ml-2 rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                    {pending.length}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
          <div className="h-px w-full bg-white/10" />
        </header>

        <main
          ref={mainRef}
          tabIndex={-1}
          data-app-scroll
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-none outline-none"
          style={{
            paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))",
          }}
        >
        {tab === "inbox" || tab === "album" ? (
          loading ? (
            <ModFeedListSkeleton showActions={tab === "inbox"} />
          ) : feedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-24 text-center">
              <p className="text-lg font-medium">
                {tab === "inbox" ? t("inboxEmpty") : t("albumEmpty")}
              </p>
              <p className="max-w-sm text-sm text-white/55">
                {tab === "inbox" ? t("inboxEmptyDesc") : t("albumEmptyDesc")}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {feedItems.map((item) => (
                <ModPost
                  key={item.id}
                  item={item}
                  mode={tab}
                  busy={busyId === item.id}
                  onApprove={() => void moderate(item.id, "approve")}
                  onReject={() => void moderate(item.id, "reject")}
                  onFeature={() => void moderate(item.id, "feature")}
                  onDelete={() => void deleteMedia(item.id)}
                />
              ))}
            </ul>
          )
        ) : null}

        {tab === "notify" ? (
          <div className="px-4 py-5">
            <GuestNotifyForm eventId={eventId} glass />
          </div>
        ) : null}

        {tab === "more" ? (
          <div className="flex flex-col divide-y divide-white/10">
            <div className="px-4 py-5">
              <h2 className="text-lg font-semibold">{t("moreTitle")}</h2>
              <p className="mt-1 text-sm text-white/55">{t("moreDesc")}</p>
              {wishCount !== null ? (
                <p className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/80">
                  {wishesUnlocked
                    ? t("wishesUnlockedCount", { count: wishCount })
                    : t("wishesSealedCount", { count: wishCount })}
                </p>
              ) : (
                <WishCountSkeleton />
              )}
            </div>

            <SettingsToggle
              title={t("manualApproval")}
              description={t("manualApprovalDesc")}
              checked={settings.requireManualApproval}
              disabled={savingSettings}
              onCheckedChange={(checked) =>
                void patchSettings({ requireManualApproval: checked })
              }
            />
            <SettingsToggle
              title={t("disableLikes")}
              description={t("disableLikesDesc")}
              checked={settings.disableLikes}
              disabled={savingSettings}
              onCheckedChange={(checked) =>
                void patchSettings({ disableLikes: checked })
              }
            />

            <div className="px-4 py-4">
              <p className="text-sm font-semibold text-white">{t("albumPermission")}</p>
              <p className="mt-1 text-xs text-white/50">{t("albumPermissionDesc")}</p>
              <div className="mt-3 grid gap-2">
                {(
                  [
                    ["view_upload", "albumViewUpload"],
                    ["view_only", "albumViewOnly"],
                    ["upload_only", "albumUploadOnly"],
                  ] as const
                ).map(([value, labelKey]) => (
                  <button
                    key={value}
                    type="button"
                    disabled={savingSettings}
                    onClick={() => void patchSettings({ albumPermission: value })}
                    className={cn(
                      "tap-press rounded-xl border px-3 py-3 text-left text-sm transition",
                      settings.albumPermission === value
                        ? "border-amber-300/50 bg-amber-400/10 text-white"
                        : "border-white/15 bg-white/5 text-white/75 active:bg-white/10",
                    )}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 py-5">
              {moderationQr ? (
                <div className="mb-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{t("moderationQrTitle")}</p>
                    <p className="mt-1 text-xs text-white/50">{t("moderationQrDesc")}</p>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={moderationQr.imageUrl}
                    alt={t("moderationQrTitle")}
                    className="mx-auto w-40 rounded-xl bg-white p-2"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => {
                      void navigator.clipboard.writeText(moderationQr.url);
                      toast.success(t("moderationQrCopied"));
                    }}
                  >
                    {t("moderationQrCopy")}
                  </Button>
                </div>
              ) : null}
              <Button
                variant="outline"
                className="h-11 w-full gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10"
                asChild
              >
                <Link href={orgPath(`/events/${eventId}/media`)}>
                  <ExternalLink className="size-4" />
                  {t("openDesktopMedia")}
                </Link>
              </Button>
              <p className="mt-2 text-center text-xs text-white/40">{orgSlug}</p>
            </div>
          </div>
        ) : null}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-neutral-950/90 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch">
          {(
            [
              { id: "inbox" as const, icon: Inbox, label: t("navInbox") },
              { id: "album" as const, icon: Images, label: t("navAlbum") },
              { id: "notify" as const, icon: Bell, label: t("navNotify") },
              { id: "more" as const, icon: MoreHorizontal, label: t("navMore") },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "tap-press relative flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition",
                tab === item.id ? "text-white" : "text-white/45 active:text-white/75",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
              {item.id === "inbox" && pending.length > 0 ? (
                <span className="absolute right-[18%] top-1.5 size-1.5 rounded-full bg-amber-400" />
              ) : null}
            </button>
          ))}
        </div>
      </nav>
      </div>
    </div>
  );
}

function SettingsToggle({
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs text-white/50">{description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

function ModPost({
  item,
  mode,
  busy,
  onApprove,
  onReject,
  onFeature,
  onDelete,
}: {
  item: ModMediaItem;
  mode: "inbox" | "album";
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onFeature: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("moderatorAlbum");
  const isVideo = item.mimeType?.startsWith("video/");

  return (
    <li className="bg-neutral-950">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/80">
          {(item.uploadedBy ?? "?").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {item.uploadedBy ? `@${item.uploadedBy}` : t("guest")}
          </p>
          <p className="truncate text-xs text-white/45">
            {new Date(item.createdAt).toLocaleString()}
            {item.isFeatured || item.status === MediaStatus.FEATURED
              ? ` · ${t("featured")}`
              : null}
          </p>
        </div>
      </div>

      <div className="relative aspect-square w-full bg-black">
        {isVideo ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={item.url} className="h-full w-full object-cover" controls playsInline />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url}
            alt={item.caption ?? ""}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {item.caption ? (
        <p className="px-3 pt-2 text-sm text-white/85">{item.caption}</p>
      ) : null}

      <div className="flex flex-wrap gap-2 px-3 py-3">
        {mode === "inbox" ? (
          <>
            <Button
              type="button"
              variant="gold"
              className="h-11 flex-1 gap-1.5"
              disabled={busy}
              onClick={onApprove}
            >
              <Check className="size-4" />
              {t("approve")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 gap-1.5 border-white/20 bg-white/5 text-white hover:bg-white/10"
              disabled={busy}
              onClick={onReject}
            >
              <X className="size-4" />
              {t("reject")}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 gap-1.5 border-white/20 bg-white/5 text-white hover:bg-white/10"
              disabled={busy}
              onClick={onFeature}
            >
              <Star className="size-4" />
              {t("feature")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 gap-1.5 border-white/20 bg-white/5 text-white hover:bg-white/10"
              disabled={busy}
              onClick={onReject}
            >
              <X className="size-4" />
              {t("hide")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 gap-1.5 border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
              disabled={busy}
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
              {t("delete")}
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
