"use client";

import {
  CalendarDays,
  Camera,
  Check,
  ChevronsUpDown,
  LayoutDashboard,
  MonitorPlay,
  Settings,
  Shield,
  Smartphone,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
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
  isAdmin?: boolean;
  onNavigate?: () => void;
  onActiveEventNameChange?: (name: string | null) => void;
}

type NavMatch = "overview" | "media" | "settings-moderation" | "settings" | "mod";

interface NavItem {
  labelKey: string;
  icon: LucideIcon;
  match?: NavMatch;
  path?: string;
  href?: string;
  external?: boolean;
  sameTab?: boolean;
}

const navItemClass =
  "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors";

export function EventSidebar({
  eventId,
  userEmail,
  userName,
  className,
  onNavigate,
  onActiveEventNameChange,
}: EventSidebarProps) {
  const t = useTranslations("eventWorkspace");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgPath = useOrgPath();
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
      const current = list.find((event) => event.id === eventId) ?? list[0] ?? null;
      setActiveEvent(current);
      onActiveEventNameChange?.(current?.name ?? null);
    } catch {
      // ignore
    }
  }, [eventId, onActiveEventNameChange]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    onActiveEventNameChange?.(activeEvent?.name ?? null);
  }, [activeEvent?.name, onActiveEventNameChange]);

  const eventNav: NavItem[] = [
    {
      path: `/events/${eventId}/overview`,
      labelKey: "navHome",
      icon: LayoutDashboard,
      match: "overview",
    },
    {
      path: `/events/${eventId}/media`,
      labelKey: "navAlbum",
      icon: Camera,
      match: "media",
    },
    ...(activeEvent?.slug
      ? [
          {
            href: `/e/${activeEvent.slug}/wall`,
            external: true,
            labelKey: "navPhotoWall",
            icon: MonitorPlay,
          } satisfies NavItem,
        ]
      : []),
  ];

  const manageNav: NavItem[] = [
    {
      path: `/events/${eventId}/settings?tab=moderation`,
      labelKey: "navModeration",
      icon: Shield,
      match: "settings-moderation",
    },
    {
      path: `/events/${eventId}/settings`,
      labelKey: "navSettings",
      icon: Settings,
      match: "settings",
    },
  ];

  const toolsNav: NavItem[] = [
    {
      href: `/mod/${eventId}`,
      labelKey: "navModeratorApp",
      icon: Smartphone,
      match: "mod",
      sameTab: true,
    },
  ];

  function isActive(match: NavMatch) {
    if (match === "overview") {
      return pathname.includes(`/events/${eventId}/overview`);
    }
    if (match === "media") {
      return pathname.includes(`/events/${eventId}/media`);
    }
    if (match === "mod") {
      return pathname.includes(`/mod/${eventId}`) || pathname.includes(`/events/${eventId}/mod`);
    }
    if (match === "settings-moderation") {
      return pathname.includes(`/events/${eventId}/settings`) && settingsTab === "moderation";
    }
    if (match === "settings") {
      if (!pathname.includes(`/events/${eventId}/settings`)) return false;
      return settingsTab !== "moderation";
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

  function renderNavItem(item: NavItem) {
    const Icon = item.icon;
    const label = t(item.labelKey);

    if (item.external && item.href) {
      return (
        <a
          key={item.labelKey}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className={cn(
            navItemClass,
            "text-sidebar-foreground/70 hover:bg-white/5 hover:text-foreground",
          )}
        >
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
          {label}
        </a>
      );
    }

    if (item.sameTab && item.href) {
      const active = item.match ? isActive(item.match) : false;
      return (
        <Link
          key={item.labelKey}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            navItemClass,
            active
              ? "bg-white/10 text-foreground"
              : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-foreground",
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
            )}
          />
          {label}
        </Link>
      );
    }

    if (!item.path || !item.match) return null;

    const active = isActive(item.match);
    return (
      <Link
        key={item.path}
        href={orgPath(item.path)}
        onClick={onNavigate}
        className={cn(
          navItemClass,
          active
            ? "bg-white/10 text-foreground"
            : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-foreground",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
          )}
        />
        {label}
      </Link>
    );
  }

  function renderSection(title: string, items: NavItem[]) {
    return (
      <div className="space-y-0.5">
        <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
          {title}
        </p>
        {items.map(renderNavItem)}
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "flex h-full w-56 shrink-0 flex-col border-r border-white/10 bg-sidebar",
        className,
      )}
    >
      <div className="flex h-14 items-center border-b border-white/10 px-4">
        <Logo variant="full" size="sm" theme="light" />
      </div>

      <div className="space-y-2 border-b border-white/10 px-2 py-3">
        <div className="flex items-center justify-between px-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            {t("currentEvent")}
          </p>
          <Link
            href={orgPath("/events")}
            onClick={onNavigate}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            {t("viewAll")}
          </Link>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 w-full justify-between rounded-md border border-white/10 bg-white/[0.03] px-2.5 font-normal hover:bg-white/5"
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
            className="w-52 rounded-md border-white/15 bg-neutral-950 text-foreground shadow-none"
            align="start"
          >
            {events.map((event) => (
              <DropdownMenuItem
                key={event.id}
                className="cursor-pointer rounded-md focus:bg-white/10 focus:text-foreground"
                onClick={() => switchEvent(event.id)}
              >
                <span className="flex-1 truncate">{event.name}</span>
                {event.id === eventId ? (
                  <Check className="ml-2 h-3.5 w-3.5 text-primary" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 py-3">
        {renderSection(t("sectionEvent"), eventNav)}
        {renderSection(t("sectionManage"), manageNav)}
        {renderSection(t("sectionTools"), toolsNav)}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          href={orgPath("/settings")}
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-white/5"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[11px] font-semibold text-foreground">
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
