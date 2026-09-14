"use client";

import {
  CalendarDays,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  UsersRound,
} from "lucide-react";
import { useAuth } from "@meindesk/nextjs";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import type { DayzerDashboardData, DayzerEventItem } from "./types";

const DOT_COLORS = ["#f2a0b8", "#f0a06a", "#8ec5f0", "#5b6fd6"] as const;

function initials(name?: string | null, email?: string | null) {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return (email?.[0] ?? "U").toUpperCase();
}

interface DayzerSidebarProps {
  data: DayzerDashboardData;
  onNavigate?: () => void;
  className?: string;
}

export function DayzerSidebar({ data, onNavigate, className }: DayzerSidebarProps) {
  const t = useTranslations("nav");
  const tDash = useTranslations("dashboard");
  const tAuth = useTranslations("auth");
  const { signOut } = useAuth();
  const router = useRouter();
  const [eventsOpen, setEventsOpen] = useState(true);

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col",
        className,
      )}
      style={{
        width: "var(--dz-sidebar-w)",
        paddingLeft: "var(--dz-sidebar-pad-x)",
        paddingRight: "var(--dz-sidebar-pad-x)",
        paddingTop: "var(--dz-sidebar-pad-top)",
        paddingBottom: "18px",
      }}
    >
      <div className="flex items-center gap-2">
        <Logo variant="mark" size="sm" className="!h-7 !w-7 shrink-0" priority />
        <span
          className="truncate text-[15px] font-bold tracking-[-0.02em]"
          style={{ color: "var(--dz-ink)" }}
        >
          Evento
        </span>
      </div>

      <div className="mt-5 flex min-w-0 items-center gap-2.5">
        <Avatar
          className="shrink-0 ring-0"
          style={{ width: "var(--dz-avatar-sm)", height: "var(--dz-avatar-sm)" }}
        >
          {data.user.image ? <AvatarImage src={data.user.image} alt="" /> : null}
          <AvatarFallback className="bg-[#ece7e1] text-[10px] font-semibold text-[#333]">
            {initials(data.user.name, data.user.email)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold leading-tight" style={{ color: "var(--dz-ink)" }}>
            {data.user.name?.trim() || tDash("accountFallback")}
          </p>
          <p className="truncate text-[10px] leading-tight" style={{ color: "var(--dz-ink-muted)" }}>
            {data.orgRoleLabel}
          </p>
        </div>
      </div>

      <nav className="mt-7 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        <NavLink
          href={`/org/${data.orgSlug}/dashboard`}
          icon={LayoutDashboard}
          label={t("overview")}
          active
          onNavigate={onNavigate}
        />
        <NavLink
          href={data.teamHref}
          icon={UsersRound}
          label={t("team")}
          onNavigate={onNavigate}
        />

        <button
          type="button"
          onClick={() => setEventsOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[12.5px] font-medium transition-colors hover:bg-black/[0.03]"
          style={{ height: "var(--dz-nav-item-h)", color: "var(--dz-ink)" }}
        >
          <CalendarDays className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
          <span className="min-w-0 flex-1 truncate">{t("events")}</span>
          <ChevronDown
            className={cn("h-3.5 w-3.5 shrink-0 opacity-50 transition-transform", eventsOpen && "rotate-180")}
            strokeWidth={1.75}
          />
        </button>

        {eventsOpen ? (
          <ul className="mb-1 mt-0.5 space-y-0.5" style={{ paddingLeft: "var(--dz-nested-indent)" }}>
            {data.nestedEvents.map((event, i) => (
              <NestedEventLink
                key={event.id}
                event={event}
                color={DOT_COLORS[i % DOT_COLORS.length]!}
                onNavigate={onNavigate}
              />
            ))}
            <li>
              <Link
                href={data.createEventHref}
                onClick={onNavigate}
                className="block truncate py-1.5 text-[11.5px] font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--dz-ink-soft)" }}
              >
                + {tDash("addNewEvent")}
              </Link>
            </li>
          </ul>
        ) : null}

        <NavLink
          href={data.settingsHref}
          icon={Settings}
          label={t("settings")}
          onNavigate={onNavigate}
        />
        {data.billingHref ? (
          <NavLink
            href={data.billingHref}
            icon={CreditCard}
            label={t("billing")}
            onNavigate={onNavigate}
          />
        ) : null}
        {data.adminHref ? (
          <NavLink
            href={data.adminHref}
            icon={Shield}
            label={t("admin")}
            onNavigate={onNavigate}
          />
        ) : null}
      </nav>

      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="mt-auto flex items-center gap-2.5 pt-3 text-left text-[12px] font-medium transition-opacity hover:opacity-70"
        style={{ color: "var(--dz-ink)" }}
      >
        <span
          className="inline-flex items-center justify-center rounded-[7px] bg-[#1a1a1a] text-white"
          style={{ width: "var(--dz-logout-size)", height: "var(--dz-logout-size)" }}
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        {tAuth("signOut")}
      </button>
    </aside>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  onNavigate,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  active?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-[10px] px-2.5 text-[12.5px] font-medium transition-colors",
        !active && "hover:bg-black/[0.03]",
      )}
      style={{
        height: "var(--dz-nav-item-h)",
        background: active ? "var(--dz-active-nav)" : "transparent",
        color: "var(--dz-ink)",
      }}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function NestedEventLink({
  event,
  color,
  onNavigate,
}: {
  event: DayzerEventItem;
  color: string;
  onNavigate?: () => void;
}) {
  return (
    <li>
      <Link
        href={event.overviewHref}
        onClick={onNavigate}
        className="flex items-center gap-2 py-1.5 text-[11.5px] font-medium transition-opacity hover:opacity-70"
        style={{ color: "var(--dz-ink)" }}
      >
        <span
          className="shrink-0 rounded-full"
          style={{
            width: "var(--dz-dot-size)",
            height: "var(--dz-dot-size)",
            background: color,
          }}
        />
        <span className="truncate">{event.name}</span>
      </Link>
    </li>
  );
}
