"use client";

import {
  CalendarDays,
  Camera,
  Check,
  ChevronsUpDown,
  Home,
  MonitorPlay,
  Palette,
  Settings,
  Shield,
  Smartphone,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useOrgPath } from "@/components/providers/org-provider";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface EventSummary {
  id: string;
  name: string;
  slug: string;
}

interface EventSidebarProps {
  eventId: string;
  userEmail?: string | null;
  userName?: string | null;
  className?: string;
}

export function EventSidebar({
  eventId,
  userEmail,
  userName,
  className,
}: EventSidebarProps) {
  const t = useTranslations("eventWorkspace");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgPath = useOrgPath;
  const settingsTab = searchParams.get("tab");
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [activeEvent, setActiveEvent] = useState<EventSummary | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const response = await fetch("/api/events?pageSize=50");
      if (!response.ok) return;
      const json = await response.json();
      const list = (json.data?.events ?? []) as EventSummary[];
      setEvents(list);
      setActiveEvent(list.find((event) => event.id === eventId) ?? list[0] ?? null);
    } catch {
      // ignore
    }
  }, [eventId]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const primaryNav = [
    {
      path: `/events/${eventId}/overview`,
      label: t("navHome"),
      icon: Home,
      match: "overview",
    },
    {
      path: `/events/${eventId}/media`,
      label: t("navAlbum"),
      icon: Camera,
      match: "media",
    },
    {
      href: activeEvent?.slug ? `/e/${activeEvent.slug}/wall` : undefined,
      external: true,
      label: t("navPhotoWall"),
      icon: MonitorPlay,
      match: "wall-external",
    },
    {
      path: `/events/${eventId}/settings?tab=moderation`,
      label: t("navModeration"),
      icon: Shield,
      match: "settings-moderation",
    },
    {
      path: `/events/${eventId}/mod`,
      label: t("navModeratorApp"),
      icon: Smartphone,
      match: "mod",
    },
  ];

  const secondaryNav = [
    {
      path: `/events/${eventId}/settings?tab=appearance`,
      label: t("navCustomize"),
      icon: Palette,
      match: "settings-appearance",
    },
    {
      path: `/events/${eventId}/settings`,
      label: t("navSettings"),
      icon: Settings,
      match: "settings",
    },
  ];

  function isActive(match: string) {
    if (match === "overview") {
      return pathname.includes(`/events/${eventId}/overview`);
    }
    if (match === "media") {
      return pathname.includes(`/events/${eventId}/media`);
    }
    if (match === "mod") {
      return pathname.includes(`/events/${eventId}/mod`);
    }
    if (match === "settings-moderation") {
      return pathname.includes(`/events/${eventId}/settings`) && settingsTab === "moderation";
    }
    if (match === "settings-appearance") {
      return pathname.includes(`/events/${eventId}/settings`) && settingsTab === "appearance";
    }
    if (match === "settings") {
      if (!pathname.includes(`/events/${eventId}/settings`)) return false;
      // General + photo wall + collaborators all live under Settings
      return (
        !settingsTab ||
        settingsTab === "general" ||
        settingsTab === "photoWall" ||
        settingsTab === "collaborators"
      );
    }
    return false;
  }

  function switchEvent(nextId: string) {
    if (nextId === eventId) return;
    const suffix = pathname.includes("/media")
      ? "media"
      : pathname.includes("/settings")
        ? "settings"
        : "overview";
    router.push(orgPath(`/events/${nextId}/${suffix}`));
  }

  const displayName = userName?.trim() || t("myAccount");
  const initials = (userName?.trim() || userEmail || "U")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={cn(
        "flex h-full w-56 shrink-0 flex-col border-r border-white/10 bg-sidebar/60 backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex h-14 items-center px-4">
        <Logo variant="full" size="sm" theme="light" />
      </div>

      <div className="space-y-2 px-3 pb-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("currentEvent")}
          </p>
          <Link
            href={orgPath("/events")}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            {t("viewAll")}
          </Link>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="glass"
              className="h-9 w-full justify-between rounded-full px-2.5 font-normal"
            >
              <span className="flex min-w-0 items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm">
                  {activeEvent?.name ?? t("currentEvent")}
                </span>
              </span>
              <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-40" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-52 rounded-xl border-white/15 bg-black/85 text-foreground shadow-none backdrop-blur-xl"
            align="start"
          >
            {events.map((event) => (
              <DropdownMenuItem
                key={event.id}
                className="cursor-pointer rounded-lg focus:bg-white/10 focus:text-foreground"
                onClick={() => switchEvent(event.id)}
              >
                <span className="flex-1 truncate">{event.name}</span>
                {event.id === eventId ? (
                  <Check className="ml-2 h-3.5 w-3.5 text-gold" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2">
        {primaryNav.map((item) => {
          const Icon = item.icon;
          const navClass =
            "group relative flex items-center gap-2.5 rounded-full px-2.5 py-2 text-[13px] font-medium transition-all";

          if (item.external) {
            if (!item.href) {
              return (
                <span
                  key={item.label}
                  className={cn(navClass, "cursor-default text-sidebar-foreground/40")}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  {item.label}
                </span>
              );
            }
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  navClass,
                  "border border-transparent text-sidebar-foreground/70 hover:border-white/10 hover:bg-white/5 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                {item.label}
              </a>
            );
          }

          if (!item.path) return null;

          const active = isActive(item.match);
          return (
            <Link
              key={item.path}
              href={orgPath(item.path)}
              className={cn(
                navClass,
                active
                  ? "border border-white/20 bg-black/45 text-foreground backdrop-blur-md"
                  : "border border-transparent text-sidebar-foreground/70 hover:border-white/10 hover:bg-white/5 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-gold" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {item.label}
            </Link>
          );
        })}

        <div className="my-2 border-t border-white/10" />

        {secondaryNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.match);
          return (
            <Link
              key={item.path}
              href={orgPath(item.path)}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-full px-2.5 py-2 text-[13px] font-medium transition-all",
                active
                  ? "border border-white/20 bg-black/45 text-foreground backdrop-blur-md"
                  : "border border-transparent text-sidebar-foreground/70 hover:border-white/10 hover:bg-white/5 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-gold" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          href={orgPath("/settings")}
          className="flex items-center gap-2.5 rounded-full border border-transparent px-1.5 py-1.5 transition-colors hover:border-white/10 hover:bg-white/5"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/45 text-[11px] font-semibold text-foreground backdrop-blur-md">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-foreground">{displayName}</p>
            {userEmail ? (
              <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
            ) : null}
          </div>
        </Link>
      </div>
    </aside>
  );
}
