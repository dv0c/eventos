"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  getEventTypeConfig,
  getHiddenGuestFields,
  WIZARD_STEPS,
  type WizardStepId,
} from "@/components/events/wizard/event-type-config";
import { DetailsStep } from "@/components/events/wizard/steps/details-step";
import { LocationStep } from "@/components/events/wizard/steps/location-step";
import { PeopleStep } from "@/components/events/wizard/steps/people-step";
import { ReviewStep } from "@/components/events/wizard/steps/review-step";
import { ThemeStep } from "@/components/events/wizard/steps/theme-step";
import { TypeStep } from "@/components/events/wizard/steps/type-step";
import { WizardProgress } from "@/components/events/wizard/wizard-progress";
import { WizardShell } from "@/components/events/wizard/wizard-shell";
import {
  WizardStepTransition,
  type WizardTransitionDirection,
} from "@/components/events/wizard/wizard-step-transition";
import {
  getDefaultFormValues,
  stepSchemas,
  wizardSchema,
  type WizardFormData,
} from "@/components/events/wizard/wizard-schema";
import { useOrgPath } from "@/components/providers/org-provider";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";

export function EventWizard() {
  const t = useTranslations("wizard");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const orgPath = useOrgPath;
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<WizardTransitionDirection>("forward");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const formScrollRef = useRef<HTMLDivElement>(null);

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: getDefaultFormValues(),
  });

  const eventType = form.watch("type");
  const config = getEventTypeConfig(eventType);
  const steps = config.steps;
  const currentStepId = steps[step] ?? "type";

  const stepLabels = useMemo(
    () =>
      Object.fromEntries(
        WIZARD_STEPS.map((stepId) => [stepId, t(`steps.${stepId}` as "steps.type")]),
      ) as Record<WizardStepId, string>,
    [t],
  );

  useEffect(() => {
    const defaults = config.defaults;
    form.setValue("primaryColor", defaults.primaryColor);
    form.setValue("secondaryColor", defaults.secondaryColor);
    form.setValue("accentColor", defaults.accentColor);
    form.setValue("style", defaults.style);

    for (const field of getHiddenGuestFields(config)) {
      form.setValue(field, 0);
    }
  }, [eventType, config, form]);

  useEffect(() => {
    formScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  async function onSubmit(data: WizardFormData) {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          description: data.description || undefined,
          date: data.date,
          startTime: data.startTime || undefined,
          endTime: data.endTime || undefined,
          location: data.location || undefined,
          address: data.address || undefined,
          hostName: data.hostName || undefined,
          hostPhone: data.hostPhone || undefined,
          hostEmail: data.hostEmail || undefined,
          expectedGuests: data.expectedGuests,
          expectedCouples: data.expectedCouples,
          expectedChildren: data.expectedChildren,
          expectedVip: data.expectedVip,
          theme: {
            primaryColor: data.primaryColor,
            secondaryColor: data.secondaryColor,
            accentColor: data.accentColor,
            style: data.style,
            coverImageKey: data.coverImageKey,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error?.message ?? t("submitError"));
        setIsSubmitting(false);
        return;
      }

      toast.success(t("submitSuccess"));
      const eventId = result.data?.event?.id;
      if (eventId) {
        router.push(orgPath(`/events/${eventId}/overview`));
      } else {
        router.push(orgPath("/events"));
      }
    } catch {
      toast.error(t("submitError"));
      setIsSubmitting(false);
    }
  }

  async function handleCoverUpload(file: File) {
    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "covers");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error?.message ?? t("coverUploadError"));
        return;
      }

      form.setValue("coverImageKey", result.data.key);
      setCoverPreview(result.data.url);
      toast.success(t("coverUploadSuccess"));
    } catch {
      toast.error(t("coverUploadError"));
    } finally {
      setIsUploadingCover(false);
    }
  }

  async function validateCurrentStep(): Promise<boolean> {
    const stepId = steps[step];
    const values = form.getValues();
    const schema = stepSchemas[stepId as keyof typeof stepSchemas];

    if (!schema) {
      return true;
    }

    const result = schema.safeParse(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          form.setError(field as keyof WizardFormData, {
            message: issue.message,
          });
        }
      }
      toast.error(t("validation.stepIncomplete"));
      return false;
    }

    return true;
  }

  async function nextStep() {
    const isValid = await validateCurrentStep();
    if (!isValid) {
      return;
    }

    if (step < steps.length - 1) {
      setDirection("forward");
      setStep(step + 1);
    }
  }

  function prevStep() {
    if (step > 0) {
      setDirection("backward");
      setStep(step - 1);
    }
  }

  function renderStep() {
    switch (currentStepId) {
      case "type":
        return <TypeStep form={form} />;
      case "details":
        return <DetailsStep form={form} />;
      case "location":
        return <LocationStep form={form} />;
      case "people":
        return <PeopleStep form={form} />;
      case "theme":
        return (
          <ThemeStep
            form={form}
            coverPreview={coverPreview}
            isUploadingCover={isUploadingCover}
            onCoverUpload={handleCoverUpload}
          />
        );
      case "review":
        return <ReviewStep form={form} />;
      default:
        return null;
    }
  }

  const headline = t(`stepQuestions.${currentStepId}.title` as "stepQuestions.type.title");
  const resolvedSubheadline =
    currentStepId === "details"
      ? t(config.descriptionKey as "stepQuestions.details.wedding")
      : t(`stepQuestions.${currentStepId}.subtitle` as "stepQuestions.type.subtitle");

  return (
    <WizardShell
      step={currentStepId}
      eventType={eventType}
      headline={headline}
      subheadline={resolvedSubheadline}
      direction={direction}
      formScrollRef={formScrollRef}
      progress={
        <WizardProgress
          steps={steps}
          currentStep={step}
          stepLabels={stepLabels}
        />
      }
      headerActions={
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href={orgPath("/events")}>
            <ArrowLeft className="size-4" />
            {t("backToEvents")}
          </Link>
        </Button>
      }
      footer={
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={step === 0}
          >
            {tCommon("previous")}
          </Button>
          {step < steps.length - 1 ? (
            <Button type="button" variant="gold" onClick={() => void nextStep()}>
              {tCommon("next")}
            </Button>
          ) : (
            <Button type="submit" variant="gold" disabled={isSubmitting}>
              {isSubmitting ? t("creating") : t("createEvent")}
            </Button>
          )}
        </form>
      }
    >
      <WizardStepTransition transitionKey={currentStepId} direction={direction}>
        {renderStep()}
      </WizardStepTransition>
    </WizardShell>
  );
}
