"use client";

import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";

import { getEventTypeConfig } from "@/components/events/wizard/event-type-config";
import type { WizardFormData } from "@/components/events/wizard/wizard-schema";
import { WizardFormSection } from "@/components/events/wizard/wizard-form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PeopleStepProps {
  form: UseFormReturn<WizardFormData>;
}

export function PeopleStep({ form }: PeopleStepProps) {
  const t = useTranslations("wizard");
  const eventType = form.watch("type");
  const config = getEventTypeConfig(eventType);

  if (!config.host.show) {
    return null;
  }

  return (
    <div className="space-y-8">
      <WizardFormSection sectionKey={`${eventType}-host`} className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{t("peopleHostTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("peopleHostSubtitle")}</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hostName" className="text-base">
              {t(config.host.labelKeys.name as "hostLabels.coupleName")}
            </Label>
            <Input
              id="hostName"
              {...form.register("hostName")}
              className="h-12 text-base"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hostPhone" className="text-base">
                {t(config.host.labelKeys.phone as "hostLabels.couplePhone")}
              </Label>
              <Input
                id="hostPhone"
                {...form.register("hostPhone")}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostEmail" className="text-base">
                {t(config.host.labelKeys.email as "hostLabels.coupleEmail")}
              </Label>
              <Input
                id="hostEmail"
                type="email"
                {...form.register("hostEmail")}
                className="h-12 text-base"
              />
            </div>
          </div>
        </div>
      </WizardFormSection>
    </div>
  );
}
