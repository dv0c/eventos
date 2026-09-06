"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";

import { EVENT_TYPES } from "@/components/events/wizard/event-type-config";
import {
  EVENT_TYPE_IMAGE_ALTS,
  EVENT_TYPE_IMAGES,
} from "@/components/events/wizard/illustrations/event-type-images";
import type { WizardFormData } from "@/components/events/wizard/wizard-schema";
import { cn } from "@/lib/utils";

interface TypeStepProps {
  form: UseFormReturn<WizardFormData>;
}

export function TypeStep({ form }: TypeStepProps) {
  const t = useTranslations("wizard");
  const tEvents = useTranslations("events");
  const selectedType = form.watch("type");

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {EVENT_TYPES.map((type) => {
        const isSelected = selectedType === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => form.setValue("type", type, { shouldDirty: true })}
            className={cn(
              "group flex items-center gap-3 rounded-xl border bg-card p-2.5 text-left transition-all",
              "hover:border-gold/30 hover:shadow-sm",
              isSelected
                ? "border-gold/40 bg-gold/5 shadow-sm ring-1 ring-gold/20"
                : "border-border/60",
            )}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center">
              <Image
                src={EVENT_TYPE_IMAGES[type]}
                alt={EVENT_TYPE_IMAGE_ALTS[type]}
                width={40}
                height={40}
                className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-medium">
                {tEvents(`types.${type.toLowerCase()}` as "types.wedding")}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {t(`typeDescriptions.${type.toLowerCase()}` as "typeDescriptions.wedding")}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
