"use client";

import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import type { DayzerDashboardData, DayzerEventItem, DayzerFeaturedStats } from "./types";

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

function ProgressRing({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <div className="relative h-[56px] w-[56px] shrink-0">
      <svg viewBox="0 0 56 56" className="h-full w-full -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#f0e6c8" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">
        {Math.round(clamped)}%
      </span>
    </div>
  );
}

interface DayzerMainCardProps {
  data: DayzerDashboardData;
}

export function DayzerMainCard({ data }: DayzerMainCardProps) {
  const t = useTranslations("dashboard");
  const tEvents = useTranslations("events");
  const featured = data.featured;
  const stats = data.featuredStats;
  const members = data.members.slice(0, 3);

  if (!featured) {
    return (
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white"
        style={{
          borderRadius: "var(--dz-card-radius)",
          boxShadow: "var(--dz-card-shadow)",
          padding: "var(--dz-card-pad-top) var(--dz-card-pad-x) 22px",
        }}
      >
        <div className="flex flex-1 flex-col items-start justify-center gap-3 py-8">
          <h2 className="max-w-[20ch] text-[22px] font-bold leading-tight tracking-tight">
            {t("noEvents")}
          </h2>
          <p className="max-w-[36ch] text-[13px]" style={{ color: "var(--dz-ink-soft)" }}>
            {t("noEventsDesc")}
          </p>
          <Link
            href={data.createEventHref}
            className="mt-2 inline-flex items-center justify-center rounded-[10px] bg-[#111] px-4 text-[12px] font-semibold text-white transition-opacity hover:opacity-85"
            style={{ height: "var(--dz-btn-open-h)" }}
          >
            {t("createEvent")}
          </Link>
        </div>
      </div>
    );
  }

  const taskPct =
    stats && stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : null;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white"
      style={{
        borderRadius: "var(--dz-card-radius)",
        boxShadow: "var(--dz-card-shadow)",
      }}
    >
      {/* Card header */}
      <div
        className="shrink-0"
        style={{
          padding: "var(--dz-card-pad-top) var(--dz-card-pad-x) 16px",
          minHeight: "var(--dz-card-header-h)",
        }}
      >
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h2
              className="line-clamp-2 text-[20px] font-bold leading-[1.25] tracking-tight sm:text-[22px]"
              style={{ color: "var(--dz-ink)" }}
              title={featured.name}
            >
              {featured.name}
            </h2>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px]" style={{ color: "var(--dz-ink-muted)" }}>
                  {t("membersConnected")}
                </p>
                <div className="mt-1.5 flex items-center">
                  {members.length === 0 ? (
                    <span className="text-[11px]" style={{ color: "var(--dz-ink-muted)" }}>
                      —
                    </span>
                  ) : (
                    members.map((m, i) => (
                      <Avatar
                        key={m.id}
                        className="ring-2 ring-white"
                        style={{
                          width: 28,
                          height: 28,
                          marginLeft: i === 0 ? 0 : -8,
                          zIndex: members.length - i,
                        }}
                      >
                        {m.image ? <AvatarImage src={m.image} alt="" /> : null}
                        <AvatarFallback className="bg-[#ece7e1] text-[9px] font-semibold text-[#444]">
                          {initials(m.name, m.email)}
                        </AvatarFallback>
                      </Avatar>
                    ))
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={featured.messagesHref}
                  className="inline-flex items-center justify-center rounded-full border border-[#e5e0da] bg-white transition-opacity hover:opacity-70"
                  style={{ width: "var(--dz-icon-btn)", height: "var(--dz-icon-btn)" }}
                  aria-label={t("railMessages")}
                >
                  <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
                </Link>
                <Link
                  href={featured.overviewHref}
                  className="inline-flex items-center justify-center rounded-[10px] bg-[#111] px-4 text-[12px] font-semibold text-white transition-opacity hover:opacity-85"
                  style={{ height: "var(--dz-btn-open-h)" }}
                >
                  {tEvents("open")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-[var(--dz-card-pad-x)] h-px shrink-0 bg-[#ebe7e2]" />

      {/* Body: stats | list */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden px-[var(--dz-card-pad-x)] py-4 md:grid-cols-2 md:gap-8">
        <StatsColumn
          firstName={data.firstName}
          featured={featured}
          stats={stats}
          taskPct={taskPct}
          createHref={data.createEventHref}
        />
        <EventsColumn events={data.listEvents} openLabel={tEvents("open")} />
      </div>
    </div>
  );
}

function StatsColumn({
  firstName,
  featured,
  stats,
  taskPct,
  createHref,
}: {
  firstName: string;
  featured: DayzerEventItem;
  stats: DayzerFeaturedStats | null;
  taskPct: number | null;
  createHref: string;
}) {
  const t = useTranslations("dashboard");

  return (
    <div className="flex min-h-0 flex-col overflow-hidden">
      <h3 className="mb-3 text-[12px] font-semibold" style={{ color: "var(--dz-ink)" }}>
        {t("statsHeading")}
      </h3>

      <div
        className="relative overflow-hidden rounded-[14px] px-4 py-3.5"
        style={{ background: "var(--dz-mint)", minHeight: 88 }}
      >
        <p className="relative z-[1] max-w-[16ch] text-[15px] font-bold leading-snug">
          {t("welcomeWarm", { firstName })}
        </p>
        <Link
          href={featured.overviewHref}
          className="relative z-[1] mt-3 inline-flex items-center justify-center rounded-[9px] bg-white px-3 text-[11px] font-semibold transition-opacity hover:opacity-80"
          style={{ height: 28, color: "var(--dz-ink)" }}
        >
          {t("openEvent")}
        </Link>
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-4 -right-3 h-24 w-24 rounded-full opacity-40"
          style={{ background: "var(--dz-mint-deep)" }}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <StatTile label={t("statGuests")} value={stats ? String(stats.guestCount) : "—"} />
        <StatTile label={t("statPhotos")} value={stats ? String(stats.photoCount) : "—"} />
      </div>

      <div
        className="mt-2.5 flex items-center justify-between gap-3 rounded-[14px] px-3.5 py-3"
        style={{ background: "var(--dz-yellow)", minHeight: 72 }}
      >
        <div className="min-w-0">
          <p className="text-[12px] font-semibold">{t("progressHeading")}</p>
          <p className="mt-0.5 text-[11px]" style={{ color: "var(--dz-ink-soft)" }}>
            {taskPct != null && stats
              ? t("tasksProgress", {
                  done: stats.completedTasks,
                  total: stats.totalTasks,
                })
              : t("tasksProgressEmpty")}
          </p>
        </div>
        {taskPct != null ? (
          <ProgressRing value={taskPct} />
        ) : (
          <Link
            href={createHref}
            className="shrink-0 text-[11px] font-semibold underline-offset-2 hover:underline"
          >
            {t("createEvent")}
          </Link>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[12px] px-3 py-2.5"
      style={{ background: "var(--dz-stat-bg)", minHeight: 64 }}
    >
      <p className="truncate text-[18px] font-bold leading-none tabular-nums">{value}</p>
      <p className="mt-1.5 truncate text-[10px]" style={{ color: "var(--dz-ink-muted)" }}>
        {label}
      </p>
    </div>
  );
}

function EventsColumn({
  events,
  openLabel,
}: {
  events: DayzerEventItem[];
  openLabel: string;
}) {
  const t = useTranslations("dashboard");
  const tEvents = useTranslations("events");

  return (
    <div className="flex min-h-0 flex-col overflow-hidden">
      <h3 className="mb-3 text-[12px] font-semibold" style={{ color: "var(--dz-ink)" }}>
        {t("upcomingLive")}
      </h3>
      <ul className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5">
        {events.length === 0 ? (
          <li
            className="rounded-[12px] border border-[#ece7e1] px-3.5 py-4 text-[12px]"
            style={{ color: "var(--dz-ink-muted)" }}
          >
            {t("noUpcoming")}
          </li>
        ) : (
          events.slice(0, 3).map((event) => (
            <li
              key={event.id}
              className="rounded-[12px] border border-[#ece7e1] px-3.5 py-2.5"
              style={{ minHeight: 72 }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-[10px] font-medium" style={{ color: "var(--dz-ink-muted)" }}>
                  {event.clientName || event.dateLabel}
                </p>
                <span className="shrink-0 text-[10px] tabular-nums" style={{ color: "var(--dz-ink-muted)" }}>
                  {event.dateLabel}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug" title={event.name}>
                {event.name}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "truncate text-[10px] font-medium",
                    event.lifecycle === "active" && "text-emerald-700",
                    event.lifecycle === "waiting" && "text-[#8a7f74]",
                    event.lifecycle === "ended" && "text-[#9a9a9a]",
                  )}
                >
                  {tEvents(`lifecycle.${event.lifecycle}`)}
                </span>
                <Link
                  href={event.overviewHref}
                  className="shrink-0 text-[11px] font-semibold underline-offset-2 hover:underline"
                >
                  {openLabel}
                </Link>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
