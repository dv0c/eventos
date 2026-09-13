"use client";

import { EventType } from "@prisma/client";
import {
  Cake,
  CircleHelp,
  Mic2,
  PartyPopper,
  Heart,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { TimePicker } from "@/components/ui/time-picker";
import { orgPath } from "@/lib/org-path";
import { cn } from "@/lib/utils";
import type { EventWithRelations } from "@/server/repositories/event.repository";

const TYPE_OPTIONS: { type: EventType; icon: typeof Heart; labelKey: string }[] = [
  { type: EventType.WEDDING, icon: Heart, labelKey: "typeWedding" },
  { type: EventType.PARTY, icon: PartyPopper, labelKey: "typeParty" },
  { type: EventType.CONFERENCE, icon: Mic2, labelKey: "typeConference" },
  { type: EventType.BIRTHDAY, icon: Cake, labelKey: "typeBirthday" },
  { type: EventType.OTHER, icon: CircleHelp, labelKey: "typeOther" },
];

function calendarDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Normalize DB clock strings (e.g. "9:00", "17:00:00") to HH:mm for TimePicker. */
function normalizeClock(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return "";
  return `${String(Number(match[1])).padStart(2, "0")}:${match[2]}`;
}

export function GeneralTab({
  event,
  orgSlug,
}: {
  event: EventWithRelations;
  orgSlug: string;
}) {
  const t = useTranslations("eventWorkspace.settings");
  const tEvents = useTranslations("events");
  const tCommon = useTranslations("common");
  const tWizard = useTranslations("wizard");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [name, setName] = useState(event.name);
  const [date, setDate] = useState(calendarDateString(event.date));
  const [startTime, setStartTime] = useState(normalizeClock(event.startTime));
  const [type, setType] = useState<EventType>(event.type);

  async function patchEvent(body: Record<string, unknown>, successToast = true) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        toast.error(t("saveFailed"));
        setIsLoading(false);
        return false;
      }
      if (successToast) toast.success(tCommon("save"));
      router.refresh();
      setIsLoading(false);
      return true;
    } catch {
      toast.error(t("saveFailed"));
      setIsLoading(false);
      return false;
    }
  }

  async function saveAll(e: React.FormEvent) {
    e.preventDefault();
    await patchEvent({
      name,
      date,
      startTime: startTime || null,
      type,
    });
  }

  async function deleteEvent() {
    const confirmed = window.confirm(
      `${tEvents("deleteConfirm")}\n\n${tEvents("deleteWarning")}`,
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error(t("deleteFailed"));
        setIsDeleting(false);
        return;
      }
      toast.success(t("deleteSuccess"));
      window.location.assign(orgPath(orgSlug, "/events"));
    } catch {
      toast.error(t("deleteFailed"));
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={saveAll} className="space-y-1">
        <div className="border-b border-border/50 py-5">
          <h3 className="text-sm font-semibold">{t("eventName")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("eventNameDesc")}</p>
          <Input
            className="mt-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => void patchEvent({ name }, false)}
            required
          />
        </div>

        <div className="border-b border-border/50 py-5">
          <h3 className="text-sm font-semibold">{t("eventSchedule")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("eventScheduleDesc")}</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{tWizard("startDate")}</p>
              <DatePicker
                value={date}
                onChange={(value) => {
                  setDate(value);
                  if (value) void patchEvent({ date: value });
                }}
                placeholder={tWizard("pickDate")}
                clearLabel={tCommon("clear")}
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {t("eventStartTime")}
              </p>
              <TimePicker
                value={startTime}
                onChange={(value) => {
                  const next = normalizeClock(value);
                  setStartTime(next);
                  void patchEvent({ startTime: next || null });
                }}
                placeholder={tWizard("pickTime")}
                clearLabel={tCommon("clear")}
              />
            </div>
          </div>
          <Button type="submit" variant="gold" className="mt-4" disabled={isLoading}>
            {tCommon("save")}
          </Button>
        </div>

        <div className="py-5">
          <h3 className="text-sm font-semibold">{t("eventType")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("eventTypeDesc")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = type === option.type;
              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => {
                    setType(option.type);
                    void patchEvent({ type: option.type }, false);
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(option.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      </form>

      <section className="border-t border-destructive/20 pt-6">
        <h3 className="text-sm font-semibold text-destructive">{t("dangerZone")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{tEvents("deleteWarning")}</p>
        <Button
          type="button"
          variant="destructive"
          className="mt-4"
          disabled={isDeleting || isLoading}
          onClick={() => void deleteEvent()}
        >
          {isDeleting ? t("deleting") : tEvents("delete")}
        </Button>
      </section>
    </div>
  );
}
