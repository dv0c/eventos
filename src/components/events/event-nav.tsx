"use client";

import { useTranslations } from "next-intl";

import { useOrgPath } from "@/components/providers/org-provider";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface EventNavProps {
  eventId: string;
  className?: string;
}

interface NavItem {
  path: string;
  labelKey: string;
  suffix: string;
}

const PRIMARY_ITEMS: NavItem[] = [
  { path: "/overview", labelKey: "overview", suffix: "overview" },
  { path: "/settings", labelKey: "settings", suffix: "settings" },
];

export function EventNav({ eventId, className }: EventNavProps) {
  const t = useTranslations("eventNav");
  const pathname = usePathname();
  const orgPath = useOrgPath;

  const basePath = `/events/${eventId}`;

  function isActive(suffix: string) {
    return pathname.includes(`/events/${eventId}/${suffix}`);
  }

  return (
    <nav
      className={cn(
        "flex flex-wrap items-center gap-1 border-b border-border/60",
        className,
      )}
    >
      {PRIMARY_ITEMS.map((item) => {
        const href = orgPath(`${basePath}${item.path}`);
        const active = isActive(item.suffix);

        return (
          <Link
            key={item.path}
            href={href}
            className={cn(
              "px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
