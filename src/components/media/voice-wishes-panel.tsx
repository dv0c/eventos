"use client";

import { Lock, Mic, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WishItem {
  id: string;
  url: string;
  mimeType: string;
  fileName: string;
  durationMs: number;
  uploadedBy: string | null;
  createdAt: string;
}

interface VoiceWishesPanelProps {
  eventId: string;
  className?: string;
}

export function VoiceWishesPanel({ eventId, className }: VoiceWishesPanelProps) {
  const t = useTranslations("eventWorkspace.voiceWishes");
  const [count, setCount] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/wishes`);
      if (!response.ok) {
        toast.error(t("loadError"));
        setLoading(false);
        return;
      }
      const json = await response.json();
      setCount(json.data.count ?? 0);
      setUnlocked(Boolean(json.data.unlocked));
      setItems(json.data.items ?? []);
    } catch {
      toast.error(t("loadError"));
    }
    setLoading(false);
  }, [eventId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(wishId: string) {
    setDeletingId(wishId);
    try {
      const response = await fetch(`/api/events/${eventId}/wishes/${wishId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error(t("deleteError"));
        setDeletingId(null);
        return;
      }
      toast.success(t("deleteSuccess"));
      await load();
    } catch {
      toast.error(t("deleteError"));
    }
    setDeletingId(null);
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mic className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">{t("title")}</h2>
          {loading ? (
            <p className="mt-1 text-sm text-muted-foreground">{t("loading")}</p>
          ) : unlocked ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("unlockedDesc", { count })}
            </p>
          ) : (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Lock className="size-3.5 shrink-0" />
              {t("sealedCount", { count })}
            </p>
          )}
        </div>
      </div>

      {!loading && unlocked && items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
      ) : null}

      {!loading && unlocked && items.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-border/50 bg-background/60 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {item.uploadedBy ?? t("anonymous")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("duration", {
                      seconds: Math.round(item.durationMs / 1000),
                    })}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={deletingId === item.id}
                  onClick={() => void handleDelete(item.id)}
                  aria-label={t("delete")}
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
                <audio src={item.url} controls className="w-full" preload="metadata" />
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
