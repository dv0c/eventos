"use client";

import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";

import { LocationAutocomplete } from "@/components/events/wizard/location-autocomplete";
import type { WizardFormData } from "@/components/events/wizard/wizard-schema";

interface LocationStepProps {
  form: UseFormReturn<WizardFormData>;
}

export function LocationStep({ form }: LocationStepProps) {
  const t = useTranslations("wizard");
  const values = form.watch();

  return (
    <LocationAutocomplete
      locationValue={values.location ?? ""}
      addressValue={values.address ?? ""}
      onLocationChange={(value) =>
        form.setValue("location", value, { shouldDirty: true })
      }
      onAddressChange={(value) =>
        form.setValue("address", value, { shouldDirty: true })
      }
      locationPlaceholder={t("locationSearchPlaceholder")}
      addressPlaceholder={t("addressManualPlaceholder")}
      addressLabel={t("address")}
      noResultsText={t("locationNoResults")}
      searchingText={t("locationSearching")}
    />
  );
}
