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
            {t("startDate")}
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              ({t("optional")})
            </span>
          </Label>
          <Controller
            control={form.control}
            name="date"
            render={({ field }) => (
              <DatePicker
                id="date"
                value={field.value ?? ""}
                onChange={(value) => {
                  field.onChange(value);
                  if (!value) form.setValue("startTime", "");
                }}
                placeholder={t("pickDate")}
                clearLabel={clearLabel}
              />
            )}
          />
          <p className="text-xs text-muted-foreground">{t("startDateHint")}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="startTime" className="text-base">
            {t("startTime")}
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
                disabled={!form.watch("date")}
              />
            )}
          />
          {errors.startTime ? (
            <p className="text-sm text-destructive">{t("validation.timeRequired")}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border/60 p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{t("approvalTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("approvalDesc")}</p>
        </div>
        <Controller
          control={form.control}
          name="requireManualApproval"
          render={({ field }) => (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => field.onChange(false)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  !field.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-semibold">{t("approvalAuto")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("approvalAutoDesc")}</p>
              </button>
              <button
                type="button"
                onClick={() => field.onChange(true)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  field.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-semibold">{t("approvalManual")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("approvalManualDesc")}</p>
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}
