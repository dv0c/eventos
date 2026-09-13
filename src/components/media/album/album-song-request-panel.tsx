"use client";

import { Loader2, Music2, Search } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SearchHit {
  title: string;
  artist: string;
  artworkUrl: string | null;
  trackId: string;
  previewUrl: string | null;
}

interface QueueItem {
  id: string;
  title: string;
  artist: string;
  albumArtUrl: string | null;
  requestedBy: string | null;
  note: string | null;
  status: string;
  createdAt: string;
}

interface AlbumSongRequestPanelProps {
  albumToken: string;
  guestName: string;
}

export function AlbumSongRequestPanel({
  albumToken,
  guestName,
}: AlbumSongRequestPanelProps) {
  const t = useTranslations("publicEvent");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchHit | null>(null);
  const [freeArtist, setFreeArtist] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);

  const loadQueue = useCallback(async () => {
    try {
      const response = await fetch(`/api/public/album/${albumToken}/songs`);
      if (!response.ok) {
        setLoadingQueue(false);
        return;
      }
      const json = await response.json();
      setQueue(json.data.items ?? []);
    } catch {
      /* ignore */
    }
    setLoadingQueue(false);
  }, [albumToken]);

  useEffect(() => {
    void loadQueue();
    const id = window.setInterval(() => void loadQueue(), 12_000);
    return () => window.clearInterval(id);
  }, [loadQueue]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }

    const handle = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(
          `/api/public/music/search?q=${encodeURIComponent(q)}`,
        );
        if (response.ok) {
          const json = await response.json();
          setHits(json.data.results ?? []);
        }
      } catch {
        /* ignore */
      }
      setSearching(false);
    }, 280);

    return () => window.clearTimeout(handle);
  }, [query]);

  async function handleSubmit() {
    const title = selected?.title ?? query.trim();
    const artist = selected?.artist ?? freeArtist.trim();
    if (!title) {
      toast.error(t("albumMusicNeedTitle"));
      return;
    }
    if (!artist) {
      toast.error(t("albumMusicNeedArtist"));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/public/album/${albumToken}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          artist,
          albumArtUrl: selected?.artworkUrl ?? null,
          previewUrl: selected?.previewUrl ?? null,
          itunesTrackId: selected?.trackId ?? null,
          requestedBy: guestName,
          note: note.trim() || null,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        toast.error(json.error?.message ?? t("albumMusicSubmitError"));
        setSubmitting(false);
        return;
      }
      toast.success(t("albumMusicSubmitSuccess"));
      setQuery("");
      setSelected(null);
      setFreeArtist("");
      setHits([]);
      setNote("");
      await loadQueue();
    } catch {
      toast.error(t("albumMusicSubmitError"));
    }
    setSubmitting(false);
  }

  const playing = queue.filter((i) => i.status === "PLAYING");
  const upNext = queue.filter((i) => i.status === "APPROVED");
  const pendingMine = queue.filter(
    (i) =>
      i.status === "PENDING" &&
      i.requestedBy?.toLocaleLowerCase() === guestName.toLocaleLowerCase(),
  );

  return (
    <div className="flex flex-col gap-6 px-4 py-5">
      <div>
        <h2 className="text-lg font-semibold text-white">{t("albumMusicTitle")}</h2>
        <p className="mt-1 text-sm text-white/60">{t("albumMusicDesc")}</p>
      </div>

      <div className="space-y-3">
        <Label className="text-white/70">{t("albumMusicSearch")}</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            placeholder={t("albumMusicSearchPlaceholder")}
            className="h-11 rounded-xl border-white/15 bg-black/40 pl-10 text-white placeholder:text-white/35"
          />
          {searching ? (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-white/50" />
          ) : null}
        </div>

        {hits.length > 0 && !selected ? (
          <ul className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900/90">
            {hits.map((hit) => (
              <li key={hit.trackId}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(hit);
                    setQuery(`${hit.title} — ${hit.artist}`);
                    setFreeArtist("");
                    setHits([]);
                  }}
                  className="tap-press flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-white/5"
                >
                  {hit.artworkUrl ? (
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={hit.artworkUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                        unoptimized
                      />
                    </span>
                  ) : (
                    <span className="flex size-10 items-center justify-center rounded-lg bg-white/10">
                      <Music2 className="size-4 text-white/60" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">
                      {hit.title}
                    </span>
                    <span className="block truncate text-xs text-white/55">
                      {hit.artist}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {!selected ? (
          <div className="space-y-2">
            <Label className="text-white/70">{t("albumMusicArtist")}</Label>
            <Input
              value={freeArtist}
              onChange={(e) => setFreeArtist(e.target.value)}
              placeholder={t("albumMusicArtistPlaceholder")}
              className="h-11 rounded-xl border-white/15 bg-black/40 text-white placeholder:text-white/35"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label className="text-white/70">{t("albumMusicNote")}</Label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder={t("albumMusicNotePlaceholder")}
            className="h-11 rounded-xl border-white/15 bg-black/40 text-white placeholder:text-white/35"
          />
        </div>

        <Button
          type="button"
          variant="default"
          className="h-11 w-full rounded-xl font-semibold"
          disabled={submitting}
          onClick={() => void handleSubmit()}
        >
          {submitting ? t("albumMusicSubmitting") : t("albumMusicSubmit")}
        </Button>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/50">
          {t("albumMusicNowPlaying")}
        </h3>
        {playing.length === 0 ? (
          <p className="text-sm text-white/45">{t("albumMusicNothingPlaying")}</p>
        ) : (
          playing.map((item) => <QueueRow key={item.id} item={item} highlight />)
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/50">
          {t("albumMusicUpNext")}
        </h3>
        {loadingQueue ? (
          <p className="text-sm text-white/45">{t("albumMusicLoading")}</p>
        ) : upNext.length === 0 ? (
          <p className="text-sm text-white/45">{t("albumMusicQueueEmpty")}</p>
        ) : (
          upNext.map((item) => <QueueRow key={item.id} item={item} />)
        )}
      </section>

      {pendingMine.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/50">
            {t("albumMusicYourPending")}
          </h3>
          {pendingMine.map((item) => (
            <QueueRow key={item.id} item={item} pending />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function QueueRow({
  item,
  highlight,
  pending,
}: {
  item: QueueItem;
  highlight?: boolean;
  pending?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5",
        highlight
          ? "border-primary/40 bg-primary/10"
          : pending
            ? "border-white/10 bg-white/5"
            : "border-white/10 bg-black/30",
      )}
    >
      {item.albumArtUrl ? (
        <span className="relative size-11 shrink-0 overflow-hidden rounded-lg">
          <Image
            src={item.albumArtUrl}
            alt=""
            fill
            className="object-cover"
            sizes="44px"
            unoptimized
          />
        </span>
      ) : (
        <span className="flex size-11 items-center justify-center rounded-lg bg-white/10">
          <Music2 className="size-4 text-white/60" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{item.title}</p>
        <p className="truncate text-xs text-white/55">
          {item.artist}
          {item.requestedBy ? ` · @${item.requestedBy}` : ""}
        </p>
      </div>
    </div>
  );
}
