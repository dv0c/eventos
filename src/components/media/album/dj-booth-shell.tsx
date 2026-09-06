"use client";

import {
  Check,
  Disc3,
  Music2,
  Play,
  SkipForward,
  Square,
  X,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  focusAppScroll,
  MobileAppLock,
} from "@/components/media/album/mobile-app-lock";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface SongItem {
  id: string;
  title: string;
  artist: string;
  albumArtUrl: string | null;
  requestedBy: string | null;
  note: string | null;
  status: string;
  sortOrder: number;
  createdAt: string;
}

interface DjBoothShellProps {
  eventId: string;
  eventName: string;
}

type SongAction = "approve" | "reject" | "play" | "played" | "skip";

export function DjBoothShell({ eventId, eventName }: DjBoothShellProps) {
  const t = useTranslations("djBooth");
  const mainRef = useRef<HTMLElement>(null);
  const [items, setItems] = useState<SongItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/songs`);
      if (!response.ok) {
        toast.error(t("loadError"));
        setLoading(false);
        return;
      }
      const json = await response.json();
      setItems(json.data.items ?? []);
    } catch {
      toast.error(t("loadError"));
    }
    setLoading(false);
  }, [eventId, t]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 5_000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    const id = requestAnimationFrame(() => focusAppScroll(mainRef.current));
    return () => cancelAnimationFrame(id);
  }, []);

  async function runAction(songId: string, action: SongAction) {
    setBusyId(songId);
    try {
      const response = await fetch(`/api/events/${eventId}/songs/${songId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) {
        toast.error(t("actionError"));
        setBusyId(null);
        return;
      }
      await load();
    } catch {
      toast.error(t("actionError"));
    }
    setBusyId(null);
  }

  const playing = useMemo(
    () => items.find((i) => i.status === "PLAYING") ?? null,
    [items],
  );
  const upNext = useMemo(
    () => items.filter((i) => i.status === "APPROVED"),
    [items],
  );
  const pending = useMemo(
    () => items.filter((i) => i.status === "PENDING"),
    [items],
  );

  return (
    <div className="org-app dark fixed inset-0 z-50 bg-neutral-950 text-white">
      <MobileAppLock />
      <div
        className="mx-auto flex h-dvh max-w-lg flex-col"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <header className="shrink-0 border-b border-white/10 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-white/45">
            {t("subtitle")}
          </p>
          <h1 className="truncate text-lg font-semibold">{eventName}</h1>
          <Link
            href={`/mod/${eventId}`}
            className="mt-1 inline-block text-xs text-white/50 underline-offset-2 hover:text-white/80 hover:underline"
          >
            {t("backToMod")}
          </Link>
        </header>

        <main
          ref={mainRef}
          data-app-scroll
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-5 outline-none"
        >
          <section className="mb-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/45">
              {t("nowPlaying")}
            </h2>
            {playing ? (
              <div className="rounded-2xl border border-amber-300/35 bg-amber-300/10 p-4">
                <SongCard item={playing} large />
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="gold"
                    className="h-11 flex-1 gap-2 rounded-xl font-semibold"
                    disabled={busyId === playing.id}
                    onClick={() => void runAction(playing.id, "played")}
                  >
                    <Square className="size-4" />
                    {t("markPlayed")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 gap-2 rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                    disabled={busyId === playing.id}
                    onClick={() => void runAction(playing.id, "skip")}
                  >
                    <SkipForward className="size-4" />
                    {t("skip")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 px-4 py-10 text-center">
                <Disc3 className="size-10 text-white/30" />
                <p className="text-sm text-white/50">{t("nothingPlaying")}</p>
              </div>
            )}
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/45">
              {t("upNext")} ({upNext.length})
            </h2>
            {loading && items.length === 0 ? (
              <p className="text-sm text-white/45">{t("loading")}</p>
            ) : upNext.length === 0 ? (
              <p className="text-sm text-white/45">{t("queueEmpty")}</p>
            ) : (
              <ul className="space-y-2">
                {upNext.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <SongCard item={item} />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="gold"
                      className="size-10 shrink-0 rounded-xl"
                      disabled={busyId === item.id}
                      onClick={() => void runAction(item.id, "play")}
                      aria-label={t("play")}
                    >
                      <Play className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/45">
              {t("pending")} ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <p className="text-sm text-white/45">{t("pendingEmpty")}</p>
            ) : (
              <ul className="space-y-2">
                {pending.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-2.5"
                  >
                    <SongCard item={item} />
                    {item.note ? (
                      <p className="mt-2 text-xs text-white/50">&ldquo;{item.note}&rdquo;</p>
                    ) : null}
                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        variant="gold"
                        className="h-10 flex-1 gap-1.5 rounded-xl"
                        disabled={busyId === item.id}
                        onClick={() => void runAction(item.id, "approve")}
                      >
                        <Check className="size-4" />
                        {t("approve")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 flex-1 gap-1.5 rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10"
                        disabled={busyId === item.id}
                        onClick={() => void runAction(item.id, "reject")}
                      >
                        <X className="size-4" />
                        {t("reject")}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function SongCard({ item, large }: { item: SongItem; large?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", large && "gap-4")}>
      {item.albumArtUrl ? (
        <span
          className={cn(
            "relative shrink-0 overflow-hidden rounded-lg",
            large ? "size-20" : "size-12",
          )}
        >
          <Image
            src={item.albumArtUrl}
            alt=""
            fill
            className="object-cover"
            sizes={large ? "80px" : "48px"}
            unoptimized
          />
        </span>
      ) : (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg bg-white/10",
            large ? "size-20" : "size-12",
          )}
        >
          <Music2 className={cn(large ? "size-8" : "size-5", "text-white/50")} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-semibold text-white",
            large ? "text-lg" : "text-sm",
          )}
        >
          {item.title}
        </p>
        <p className={cn("truncate text-white/55", large ? "text-sm" : "text-xs")}>
          {item.artist}
          {item.requestedBy ? ` · @${item.requestedBy}` : ""}
        </p>
      </div>
    </div>
  );
}
