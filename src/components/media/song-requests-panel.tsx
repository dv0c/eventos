"use client";

import {
  Check,
  Music2,
  Play,
  SkipForward,
  Square,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
  createdAt: string;
}

interface SongRequestsPanelProps {
  eventId: string;
  className?: string;
}

type SongAction = "approve" | "reject" | "play" | "played" | "skip";

export function SongRequestsPanel({ eventId, className }: SongRequestsPanelProps) {
  const t = useTranslations("eventWorkspace.songRequests");
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
    const id = window.setInterval(() => void load(), 10_000);
    return () => window.clearInterval(id);
  }, [load]);

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

  async function handleDelete(songId: string) {
    setBusyId(songId);
    try {
      const response = await fetch(`/api/events/${eventId}/songs/${songId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error(t("deleteError"));
        setBusyId(null);
        return;
      }
      toast.success(t("deleteSuccess"));
      await load();
    } catch {
      toast.error(t("deleteError"));
    }
    setBusyId(null);
  }

  const active = useMemo(
    () =>
      items.filter((i) =>
        ["PENDING", "APPROVED", "PLAYING"].includes(i.status),
      ),
    [items],
  );
  const playing = active.filter((i) => i.status === "PLAYING");
  const approved = active.filter((i) => i.status === "APPROVED");
  const pending = active.filter((i) => i.status === "PENDING");

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Music2 className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{t("title")}</h2>
            {loading ? (
              <p className="mt-1 text-sm text-muted-foreground">{t("loading")}</p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                {t("summary", {
                  pending: pending.length,
                  queue: approved.length + playing.length,
                })}
              </p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-9" asChild>
          <Link href={`/mod/${eventId}/dj`}>{t("openBooth")}</Link>
        </Button>
      </div>

      {!loading && active.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
      ) : null}

      {!loading && active.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {[...playing, ...approved, ...pending].map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-border/50 bg-background/60 p-3"
            >
              <div className="flex items-start gap-3">
                {item.albumArtUrl ? (
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={item.albumArtUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized
                    />
                  </span>
                ) : (
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Music2 className="size-4 text-muted-foreground" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.artist}
                    {item.requestedBy ? ` · @${item.requestedBy}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-primary">
                    {t(`status.${item.status}` as "status.PENDING")}
                  </p>
                  {item.note ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      &ldquo;{item.note}&rdquo;
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={busyId === item.id}
                  onClick={() => void handleDelete(item.id)}
                  aria-label={t("delete")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.status === "PENDING" ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 gap-1"
                      disabled={busyId === item.id}
                      onClick={() => void runAction(item.id, "approve")}
                    >
                      <Check className="size-3.5" />
                      {t("approve")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      disabled={busyId === item.id}
                      onClick={() => void runAction(item.id, "reject")}
                    >
                      <X className="size-3.5" />
                      {t("reject")}
                    </Button>
                  </>
                ) : null}
                {item.status === "APPROVED" ? (
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 gap-1"
                    disabled={busyId === item.id}
                    onClick={() => void runAction(item.id, "play")}
                  >
                    <Play className="size-3.5" />
                    {t("play")}
                  </Button>
                ) : null}
                {item.status === "PLAYING" ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 gap-1"
                      disabled={busyId === item.id}
                      onClick={() => void runAction(item.id, "played")}
                    >
                      <Square className="size-3.5" />
                      {t("markPlayed")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      disabled={busyId === item.id}
                      onClick={() => void runAction(item.id, "skip")}
                    >
                      <SkipForward className="size-3.5" />
                      {t("skip")}
                    </Button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
