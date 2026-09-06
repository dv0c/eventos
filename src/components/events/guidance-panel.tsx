"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useTranslations } from "next-intl";

import { useOrgPath } from "@/components/providers/org-provider";
import { EventSection } from "@/components/events/event-section";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface GuidancePanelProps {
  eventId: string;
  eventSlug: string;
  daysUntilEvent: number;
  enableGallery: boolean;
  enableWall: boolean;
  totalMedia: number;
  approvedMedia: number;
  className?: string;
}

export function GuidancePanel({
  eventId,
  eventSlug,
  daysUntilEvent,
  enableGallery,
  enableWall,
  totalMedia,
  approvedMedia,
  className,
}: GuidancePanelProps) {
  const t = useTranslations("guidance");
  const orgPath = useOrgPath;
  const basePath = orgPath(`/events/${eventId}`);

  const checklist = [
    {
      id: "gallery",
      label: t("checklistGallery"),
      done: enableGallery,
      href: `${basePath}/settings`,
    },
    {
      id: "share",
      label: t("checklistShare"),
      done: totalMedia > 0,
      href: `${basePath}/overview`,
    },
    {
      id: "approve",
      label: t("checklistApprove"),
      done: approvedMedia > 0,
      href: `${basePath}/overview`,
    },
    {
      id: "wall",
      label: t("checklistWall"),
      done: enableWall && approvedMedia > 0,
      href: `/e/${eventSlug}/wall`,
    },
  ];

  return (
    <EventSection title={t("title")} className={className}>
      <div className="mb-6 rounded-xl bg-secondary/50 px-4 py-3">
        <p className="text-3xl font-semibold tabular-nums text-accent-foreground">
          {daysUntilEvent > 0 ? daysUntilEvent : 0}
        </p>
        <p className="text-sm text-muted-foreground">
          {daysUntilEvent <= 0 ? t("eventToday") : t("daysLabel")}
        </p>
      </div>

      <ul className="space-y-2">
        {checklist.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-secondary/60",
                item.done ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-foreground" />
              ) : (
                <Circle className="h-4 w-4 shrink-0" />
              )}
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </EventSection>
  );
}
