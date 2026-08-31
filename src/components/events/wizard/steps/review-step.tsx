"use client";

import { Calendar, MapPin, Palette, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";

import { getEventTypeConfig } from "@/components/events/wizard/event-type-config";
import type { WizardFormData } from "@/components/events/wizard/wizard-schema";

interface ReviewStepProps {
  form: UseFormReturn<WizardFormData>;
}

export function ReviewStep({ form }: ReviewStepProps) {
  const t = useTranslations("wizard");
  const tEvents = useTranslations("events");
  const values = form.watch();
  const config = getEventTypeConfig(values.type);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-secondary/20 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {tEvents(`types.${values.type.toLowerCase()}` as "types.wedding")}
            </p>
            <h2 className="mt-1 text-2xl font-bold">{values.name}</h2>
            {values.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{values.description}</p>
            ) : null}
          </div>
          <div
            className="size-12 shrink-0 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${values.primaryColor}, ${values.secondaryColor})`,
            }}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ReviewItem
          icon={Calendar}
          label={tEvents("date")}
          value={[values.date, values.startTime].filter(Boolean).join(" · ") || "—"}
        />
        {values.location ? (
          <ReviewItem
            icon={MapPin}
            label={tEvents("location")}
            value={values.location}
            subValue={values.address}
          />
        ) : null}
        {values.hostName ? (
          <ReviewItem
            icon={Users}
            label={t(config.host.labelKeys.name as "hostLabels.coupleName")}
            value={values.hostName}
            subValue={values.hostEmail || values.hostPhone || undefined}
          />
        ) : null}
        <ReviewItem
          icon={Palette}
          label={t("steps.theme")}
          value={
            values.style === "modern"
              ? t("styleModern")
              : values.style === "classic"
                ? t("styleClassic")
                : t("styleElegant")
          }
        />
      </div>

      <p className="rounded-xl bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        {t("reviewNote")}
      </p>
    </div>
  );
}

function ReviewItem({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-border/60 p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="size-4 text-primary" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-sm font-medium">{value}</p>
        {subValue ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{subValue}</p>
        ) : null}
      </div>
    </div>
  );
}
