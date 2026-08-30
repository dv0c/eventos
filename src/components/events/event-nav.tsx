"use client";

import {
  BarChart3,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Settings,
  UserCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface EventNavProps {
  eventId: string;
  eventSlug: string;
  className?: string;
}

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  suffix: string;
}

export function EventNav({ eventId, eventSlug, className }: EventNavProps) {
  const t = useTranslations("eventNav");
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: `/events/${eventId}/overview`, labelKey: "overview", icon: LayoutDashboard, suffix: "overview" },
    { href: `/events/${eventId}/guests`, labelKey: "guests", icon: Users, suffix: "guests" },
    { href: `/events/${eventId}/rsvp`, labelKey: "rsvp", icon: UserCheck, suffix: "rsvp" },
    { href: `/events/${eventId}/seating`, labelKey: "seating", icon: UsersRound, suffix: "seating" },
    { href: `/events/${eventId}/tasks`, labelKey: "tasks", icon: ClipboardList, suffix: "tasks" },
    { href: `/events/${eventId}/timeline`, labelKey: "timeline", icon: Calendar, suffix: "timeline" },
    { href: `/events/${eventId}/messages`, labelKey: "messages", icon: MessageSquare, suffix: "messages" },
    { href: `/events/${eventId}/collaborators`, labelKey: "collaborators", icon: UsersRound, suffix: "collaborators" },
    { href: `/events/${eventId}/analytics`, labelKey: "analytics", icon: BarChart3, suffix: "analytics" },
    { href: `/events/${eventId}/settings`, labelKey: "settings", icon: Settings, suffix: "settings" },
  ];

  return (
    <nav
      className={cn(
        "flex flex-wrap gap-1 rounded-xl border border-border/60 bg-card/50 p-1.5 backdrop-blur-sm",
        className,
      )}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.includes(`/events/${eventId}/${item.suffix}`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{t(item.labelKey)}</span>
          </Link>
        );
      })}
      <Link
        href={`/e/${eventSlug}`}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
      >
        <Mail className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">{t("publicPage")}</span>
      </Link>
    </nav>
  );
}
