"use client";

import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";

import { getEventTypeConfig } from "@/components/events/wizard/event-type-config";
import type { WizardFormData } from "@/components/events/wizard/wizard-schema";
import { WizardFormSection } from "@/components/events/wizard/wizard-form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DetailsStepProps {
  form: UseFormReturn<WizardFormData>;
}

export function DetailsStep({ form }: DetailsStepProps) {
  const t = useTranslations("wizard");
  const tEvents = useTranslations("events");
  const eventType = form.watch("type");
  const config = getEventTypeConfig(eventType);
  const errors = form.formState.errors;

  return (
    <div className="space-y-5">
      <WizardFormSection sectionKey={`${eventType}-name`} className="space-y-2">
        <Label htmlFor="name" className="text-base">
          {tEvents("name")}
        </Label>
        <Input
          id="name"
          {...form.register("name")}
          placeholder={t(config.namePlaceholderKey as "namePlaceholders.wedding")}
          className="h-12 text-base"
        />
        {errors.name ? (
          <p className="text-sm text-destructive">{t("validation.nameRequired")}</p>
        ) : null}
      </WizardFormSection>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-base">
          {tEvents("description")}
        </Label>
        <textarea
          id="description"
          rows={3}
          {...form.register("description")}
          placeholder={t("descriptionPlaceholder")}
          className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date" className="text-base">
            {tEvents("date")}
          </Label>
          <Input
            id="date"
            type="date"
            {...form.register("date")}
            className="h-12 text-base"
          />
          {errors.date ? (
            <p className="text-sm text-destructive">{t("validation.dateRequired")}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="startTime" className="text-base">
            {tEvents("time")}
          </Label>
          <Input
            id="startTime"
            type="time"
            {...form.register("startTime")}
            className="h-12 text-base"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="endTime" className="text-base">
          {t("endTime")}
        </Label>
        <Input
          id="endTime"
          type="time"
          {...form.register("endTime")}
          className="h-12 text-base"
        />
      </div>
    </div>
  );
}
