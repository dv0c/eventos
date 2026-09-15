"use client";

import type { NotificationType } from "@prisma/client";
import {
  Bell,
  CalendarClock,
  Check,
  Handshake,
  ImageIcon,
  Music2,
  ShieldAlert,
  Trash2,
  Users,
  Mic,
  AlertTriangle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: NotificationType | string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  metadata: unknown;
  eventId: string | null;
  organizationId: string | null;
  createdAt: string;
};

const POLL_MS = 30_000;

function relativeTime(
  iso: string,
  t: ReturnType<typeof useTranslations<"notifications">>,
): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return t("justNow");
  if (minutes < 60) return t("minutesAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("hoursAgo", { count: hours });
  return t("daysAgo", { count: Math.floor(hours / 24) });
}

function typeIcon(type: string) {
  switch (type) {
    case "MEDIA_PENDING":
    case "NEW_PHOTO":
      return ImageIcon;
    case "PANIC_ARMED":
      return ShieldAlert;
    case "SONG_REQUEST":
      return Music2;
    case "VOICE_WISH":
      return Mic;
    case "COLLAB_INVITE":
    case "COLLABORATOR_JOINED":
      return Handshake;
    case "ORG_INVITE":
      return Users;
    case "EVENT_ENDING_SOON":
    case "EVENT_APPROACHING":
    case "EVENT_STOPPED":
      return CalendarClock;
    case "MEDIA_PURGE_SOON":
      return Trash2;
    case "PAYMENT_FAILED":
      return AlertTriangle;
    default:
      return Bell;
  }
}

export function NotificationPanel() {
  const t = useTranslations("notifications");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications?limit=40");
      if (!response.ok) {
        if (open) toast.error(t("loadError"));
        return;
      }
      const json = await response.json();
      setItems(json.data?.items ?? []);
      setUnreadCount(json.data?.unreadCount ?? 0);
    } catch {
      if (open) toast.error(t("loadError"));
    }
  }, [open, t]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function markAllRead() {
    setLoading(true);
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }

  async function markOneRead(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
  }

  async function respondCollab(id: string, action: "accept" | "decline") {
    setBusyId(id);
    try {
      const response = await fetch("/api/notifications/collab-invite/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id, action }),
      });
      if (!response.ok) {
        toast.error(t("actionError"));
        return;
      }
      toast.success(action === "accept" ? t("accepted") : t("declined"));
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (action === "accept") {
        const json = await response.json();
        const eventId = json.data?.eventId as string | undefined;
        if (eventId) {
          setOpen(false);
          router.refresh();
        }
      }
    } catch {
      toast.error(t("actionError"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="glass"
          size="icon"
          className="relative h-8 w-8 rounded-full"
          aria-label={
            unreadCount > 0
              ? t("ariaUnread", { count: unreadCount })
              : t("ariaLabel")
          }
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="flex w-[min(100vw-1.5rem,22rem)] flex-col p-0"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5 dark:border-white/10">
          <div>
            <p className="text-sm font-semibold">{t("title")}</p>
            {unreadCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("unread", { count: unreadCount })}
              </p>
            ) : null}
          </div>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={loading}
              onClick={() => void markAllRead()}
            >
              <Check className="mr-1 h-3 w-3" />
              {t("markAllRead")}
            </Button>
          ) : null}
        </div>

        <div className="max-h-[min(70vh,24rem)] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">{t("empty")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("emptyDesc")}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/50 dark:divide-white/5">
              {items.map((item) => {
                const Icon = typeIcon(item.type);
                const isCollab = item.type === "COLLAB_INVITE" && !item.read;
                const isOrgInvite = item.type === "ORG_INVITE";
                const meta = (item.metadata ?? {}) as { token?: string };

                const content = (
                  <div className="flex gap-2.5">
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        item.read
                          ? "bg-muted/40 text-muted-foreground"
                          : "bg-primary/15 text-primary",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm leading-snug",
                          !item.read && "font-medium text-foreground",
                          item.read && "text-muted-foreground",
                        )}
                      >
                        {item.title}
                      </p>
                      {item.body ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {item.body}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[10px] text-muted-foreground/80">
                        {relativeTime(item.createdAt, t)}
                      </p>
                      {isCollab ? (
                        <div className="mt-2 flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="h-7 px-2.5 text-xs"
                            disabled={busyId === item.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              void respondCollab(item.id, "accept");
                            }}
                          >
                            {t("accept")}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs"
                            disabled={busyId === item.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              void respondCollab(item.id, "decline");
                            }}
                          >
                            {t("decline")}
                          </Button>
                        </div>
                      ) : null}
                      {isOrgInvite && meta.token ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-2 h-7 px-2.5 text-xs"
                          asChild
                        >
                          <Link
                            href={`/invite/${meta.token}`}
                            onClick={() => void markOneRead(item.id)}
                          >
                            {t("openInvite")}
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                    {!item.read ? (
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    ) : null}
                  </div>
                );

                if (item.link && !isCollab) {
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.link}
                        className="block px-3 py-3 transition-colors hover:bg-muted/40 dark:hover:bg-white/5"
                        onClick={() => {
                          if (!item.read) void markOneRead(item.id);
                          setOpen(false);
                        }}
                      >
                        {content}
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={item.id} className="px-3 py-3">
                    {content}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
