"use client";

import { CalendarPlus, MessageSquare, Plus, Users, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation";

import type { DayzerDashboardData } from "./types";

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

interface DayzerUtilityRailProps {
  data: DayzerDashboardData;
}

export function DayzerUtilityRail({ data }: DayzerUtilityRailProps) {
  const t = useTranslations("dashboard");
  const featured = data.featured;
  const railMembers = data.members.slice(0, 3);

  const actions = [
    {
      href: data.createEventHref,
      icon: CalendarPlus,
      label: t("railCreateEvent"),
    },
    {
      href: featured?.guestsHref ?? data.eventsHref,
      icon: Users,
      label: t("railGuests"),
    },
    {
      href: featured?.messagesHref ?? data.teamHref,
      icon: MessageSquare,
      label: t("railMessages"),
    },
  ] as const;

  return (
    <aside
      className="relative hidden h-full shrink-0 flex-col items-center lg:flex"
      style={{
        width: "var(--dz-rail-w)",
        paddingTop: "var(--dz-rail-pad-top)",
        paddingBottom: "22px",
      }}
    >
      <div className="absolute bottom-0 left-0 top-0 w-px bg-[#ece7e1]" />

      <Zap className="mb-6 h-4 w-4" strokeWidth={2} style={{ color: "var(--dz-ink)" }} />

      <div className="flex flex-col items-center gap-[18px]">
        {actions.map(({ href, icon: Icon, label }) => (
          <Link
            key={label}
            href={href}
            className="group flex w-[72px] flex-col items-center gap-1.5"
          >
            <span
              className="inline-flex items-center justify-center rounded-[12px] transition-colors group-hover:bg-[#e8e2db]"
              style={{
                width: "var(--dz-rail-icon)",
                height: "var(--dz-rail-icon)",
                background: "var(--dz-rail-btn)",
              }}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} style={{ color: "var(--dz-ink)" }} />
            </span>
            <span
              className="max-w-full truncate text-center text-[10px] font-medium leading-tight"
              style={{ color: "var(--dz-ink-soft)" }}
            >
              {label}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-auto flex flex-col items-center">
        <div className="flex flex-col items-center">
          {railMembers.map((member, i) => (
            <Avatar
              key={member.id}
              className="ring-2 ring-[#faf5ef]"
              style={{
                width: "var(--dz-avatar-md)",
                height: "var(--dz-avatar-md)",
                marginTop: i === 0 ? 0 : -10,
                zIndex: railMembers.length - i,
              }}
            >
              {member.image ? <AvatarImage src={member.image} alt="" /> : null}
              <AvatarFallback className="bg-[#ece7e1] text-[10px] font-semibold text-[#444]">
                {initials(member.name, member.email)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <Link
          href={data.teamHref}
          className="mt-2 inline-flex items-center justify-center rounded-full border border-[#e5e0da] bg-white transition-opacity hover:opacity-70"
          style={{ width: "var(--dz-avatar-md)", height: "var(--dz-avatar-md)" }}
          aria-label={t("railInvite")}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} style={{ color: "var(--dz-ink)" }} />
        </Link>
      </div>
    </aside>
  );
}
