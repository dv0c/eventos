"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

interface DayzerHeaderProps {
  eventsHref: string;
  onOpenMobileNav?: () => void;
}

export function DayzerHeader({ eventsHref, onOpenMobileNav }: DayzerHeaderProps) {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("nav");

  return (
    <header
      className="relative flex shrink-0 items-center"
      style={{ height: "var(--dz-header-h)" }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="inline-flex items-center justify-center rounded-[8px] border border-[#e5e0da] bg-white text-[#888] lg:hidden"
          style={{ width: 28, height: 28 }}
          aria-label={tNav("menu")}
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <Link
          href={eventsHref}
          className="hidden items-center gap-1.5 text-[12px] font-medium transition-opacity hover:opacity-70 lg:inline-flex"
          style={{ color: "var(--dz-ink-soft)" }}
        >
          <span
            className="inline-flex items-center justify-center rounded-[8px] border border-[#e5e0da] bg-white"
            style={{ width: 28, height: 28 }}
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          {tNav("events")}
        </Link>
      </div>

      <h1
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 truncate text-[22px] font-bold tracking-tight"
        style={{ color: "var(--dz-ink)", maxWidth: "46%" }}
      >
        {t("overview")}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden text-[12px] font-medium sm:inline" style={{ color: "var(--dz-ink-soft)" }}>
          {t("allEvents")}
        </span>
        <Link
          href={eventsHref}
          className="inline-flex items-center justify-center rounded-[8px] border border-[#e5e0da] bg-white text-[#888] transition-opacity hover:opacity-70"
          style={{ width: 28, height: 28 }}
          aria-label={t("allEvents")}
        >
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>
    </header>
  );
}
