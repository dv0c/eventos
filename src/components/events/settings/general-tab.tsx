"use client";

import { EventType } from "@prisma/client";
import {
  Cake,
  CircleHelp,
  Mic2,
  PartyPopper,
  Heart,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { PlusUpgradeBadge } from "@/components/events/settings/settings-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { EventWithRelations } from "@/server/repositories/event.repository";

const TYPE_OPTIONS: { type: EventType; icon: typeof Heart; labelKey: string }[] = [
  { type: EventType.WEDDING, icon: Heart, labelKey: "typeWedding" },
  { type: EventType.PARTY, icon: PartyPopper, labelKey: "typeParty" },
  { type: EventType.CONFERENCE, icon: Mic2, labelKey: "typeConference" },
  { type: EventType.BIRTHDAY, icon: Cake, labelKey: "typeBirthday" },
  { type: EventType.OTHER, icon: CircleHelp, labelKey: "typeOther" },
];

function suggestSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function GeneralTab({ event }: { event: EventWithRelations }) {
  const t = useTranslations("eventWorkspace.settings");
  const tCommon = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(event.name);
  const [slug, setSlug] = useState(event.slug);
  const [date, setDate] = useState(event.date.toISOString().split("T")[0]);
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
    await patchEvent({ name, slug, date, type });
  }

  async function saveSlug() {
    await patchEvent({ slug });
  }

  return (
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
        <h3 className="text-sm font-semibold">{t("eventDate")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("eventDateDesc")}</p>
        <Input
          className="mt-3 max-w-xs"
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            void patchEvent({ date: e.target.value }, false);
          }}
        />
      </div>

      <div className="border-b border-border/50 py-5">
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

      <div className="py-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{t("customLink")}</h3>
          <PlusUpgradeBadge variant="pro" />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t("customLinkDesc")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            /e/
          </span>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="max-w-xs"
          />
          <Button type="button" variant="gold" disabled={isLoading} onClick={() => void saveSlug()}>
            {tCommon("save")}
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 gap-1"
          onClick={() => setSlug(suggestSlug(name) || slug)}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {t("suggest")}
        </Button>
      </div>
    </form>
  );
}
