"use client";

import { useTranslations } from "next-intl";
import { Controller, type UseFormReturn } from "react-hook-form";

import { getEventTypeConfig } from "@/components/events/wizard/event-type-config";
import type { WizardFormData } from "@/components/events/wizard/wizard-schema";
import { WizardFormSection } from "@/components/events/wizard/wizard-form-section";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/ui/time-picker";

interface DetailsStepProps {
  form: UseFormReturn<WizardFormData>;
}

export function DetailsStep({ form }: DetailsStepProps) {
  const t = useTranslations("wizard");
  const tEvents = useTranslations("events");
  const tCommon = useTranslations("common");
  const eventType = form.watch("type");
  const config = getEventTypeConfig(eventType);
  const errors = form.formState.errors;
  const clearLabel = tCommon("clear");

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
          <Controller
            control={form.control}
            name="date"
            render={({ field }) => (
              <DatePicker
                id="date"
                value={field.value}
                onChange={field.onChange}
                placeholder={t("pickDate")}
                clearLabel={clearLabel}
              />
            )}
          />
          {errors.date ? (
            <p className="text-sm text-destructive">{t("validation.dateRequired")}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="startTime" className="text-base">
            {tEvents("time")}
          </Label>
          <Controller
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <TimePicker
                id="startTime"
                value={field.value}
                onChange={field.onChange}
                placeholder={t("pickTime")}
                clearLabel={clearLabel}
              />
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="endTime" className="text-base">
          {t("endTime")}
        </Label>
        <Controller
          control={form.control}
          name="endTime"
          render={({ field }) => (
            <TimePicker
              id="endTime"
              value={field.value}
              onChange={field.onChange}
              placeholder={t("pickTime")}
              clearLabel={clearLabel}
            />
          )}
        />
      </div>
    </div>
  );
}
