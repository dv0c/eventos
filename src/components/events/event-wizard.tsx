"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EventType } from "@prisma/client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";

const wizardSchema = z.object({
  type: z.nativeEnum(EventType),
  name: z.string().trim().min(1),
  description: z.string().optional(),
  date: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  hostName: z.string().optional(),
  hostPhone: z.string().optional(),
  hostEmail: z.string().email().optional().or(z.literal("")),
  expectedGuests: z.number().int().min(0),
  expectedCouples: z.number().int().min(0),
  expectedChildren: z.number().int().min(0),
  expectedVip: z.number().int().min(0),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  style: z.string(),
  coverImageKey: z.string().optional(),
});

type WizardFormData = z.infer<typeof wizardSchema>;

const STEPS = ["type", "info", "host", "guests", "theme", "finish"] as const;

const EVENT_TYPES = Object.values(EventType);

export function EventWizard() {
  const t = useTranslations("wizard");
  const tEvents = useTranslations("events");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      type: EventType.WEDDING,
      name: "",
      description: "",
      date: "",
      startTime: "",
      endTime: "",
      location: "",
      address: "",
      hostName: "",
      hostPhone: "",
      hostEmail: "",
      expectedGuests: 0,
      expectedCouples: 0,
      expectedChildren: 0,
      expectedVip: 0,
      primaryColor: "#8B5CF6",
      secondaryColor: "#F59E0B",
      accentColor: "#10B981",
      style: "elegant",
    },
  });

  const progress = ((step + 1) / STEPS.length) * 100;
  const values = form.watch();

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
        router.push(`/events/${eventId}/overview`);
      } else {
        router.push("/events");
      }
    } catch {
      toast.error(t("submitError"));
      setIsSubmitting(false);
    }
  }

  function nextStep() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  }

  function prevStep() {
    if (step > 0) {
      setStep(step - 1);
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{t(`steps.${STEPS[step]}`)}</span>
          <span>{step + 1} / {STEPS.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="surface-elevated">
        <CardHeader>
          <CardTitle>{t(`steps.${STEPS[step]}`)}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {STEPS[step] === "type" && (
              <div className="space-y-2">
                <Label>{tEvents("type")}</Label>
                <Select
                  value={values.type}
                  onValueChange={(v) => form.setValue("type", v as EventType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {tEvents(`types.${type.toLowerCase()}` as "types.wedding")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {STEPS[step] === "info" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{tEvents("name")}</Label>
                  <Input id="name" {...form.register("name")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{tEvents("description")}</Label>
                  <textarea
                    id="description"
                    rows={3}
                    {...form.register("description")}
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date">{tEvents("date")}</Label>
                    <Input id="date" type="date" {...form.register("date")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startTime">{tEvents("time")}</Label>
                    <Input id="startTime" type="time" {...form.register("startTime")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">{tEvents("location")}</Label>
                  <Input id="location" {...form.register("location")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t("address")}</Label>
                  <Input id="address" {...form.register("address")} />
                </div>
              </div>
            )}

            {STEPS[step] === "host" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hostName">{t("hostName")}</Label>
                  <Input id="hostName" {...form.register("hostName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hostPhone">{t("hostPhone")}</Label>
                  <Input id="hostPhone" {...form.register("hostPhone")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hostEmail">{t("hostEmail")}</Label>
                  <Input id="hostEmail" type="email" {...form.register("hostEmail")} />
                </div>
              </div>
            )}

            {STEPS[step] === "guests" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expectedGuests">{t("expectedGuests")}</Label>
                  <Input
                    id="expectedGuests"
                    type="number"
                    min={0}
                    {...form.register("expectedGuests")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedCouples">{t("expectedCouples")}</Label>
                  <Input
                    id="expectedCouples"
                    type="number"
                    min={0}
                    {...form.register("expectedCouples")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedChildren">{t("expectedChildren")}</Label>
                  <Input
                    id="expectedChildren"
                    type="number"
                    min={0}
                    {...form.register("expectedChildren")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedVip">{t("expectedVip")}</Label>
                  <Input
                    id="expectedVip"
                    type="number"
                    min={0}
                    {...form.register("expectedVip")}
                  />
                </div>
              </div>
            )}

            {STEPS[step] === "theme" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coverImage">{t("coverImage")}</Label>
                  <Input
                    id="coverImage"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isUploadingCover}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleCoverUpload(file);
                    }}
                  />
                  {coverPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverPreview}
                      alt={t("coverPreview")}
                      className="h-32 w-full rounded-lg object-cover"
                    />
                  ) : null}
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">{t("primaryColor")}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        className="h-10 w-14 p-1"
                        {...form.register("primaryColor")}
                      />
                      <Input {...form.register("primaryColor")} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">{t("secondaryColor")}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        className="h-10 w-14 p-1"
                        {...form.register("secondaryColor")}
                      />
                      <Input {...form.register("secondaryColor")} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">{t("accentColor")}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accentColor"
                        type="color"
                        className="h-10 w-14 p-1"
                        {...form.register("accentColor")}
                      />
                      <Input {...form.register("accentColor")} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("style")}</Label>
                  <Select
                    value={values.style}
                    onValueChange={(v) => form.setValue("style", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elegant">{t("styleElegant")}</SelectItem>
                      <SelectItem value="modern">{t("styleModern")}</SelectItem>
                      <SelectItem value="classic">{t("styleClassic")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div
                  className="rounded-xl p-6 text-center"
                  style={{
                    background: `linear-gradient(135deg, ${values.primaryColor}, ${values.secondaryColor})`,
                  }}
                >
                  <p className="text-lg font-semibold text-white">{values.name || t("preview")}</p>
                </div>
              </div>
            )}

            {STEPS[step] === "finish" && (
              <div className="space-y-3 text-sm">
                <p><strong>{tEvents("name")}:</strong> {values.name}</p>
                <p><strong>{tEvents("type")}:</strong> {tEvents(`types.${values.type.toLowerCase()}` as "types.wedding")}</p>
                <p><strong>{tEvents("date")}:</strong> {values.date}</p>
                {values.location ? (
                  <p><strong>{tEvents("location")}:</strong> {values.location}</p>
                ) : null}
                <p><strong>{t("expectedGuests")}:</strong> {values.expectedGuests}</p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={step === 0}
              >
                {tCommon("previous")}
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" variant="gold" onClick={nextStep}>
                  {tCommon("next")}
                </Button>
              ) : (
                <Button type="submit" variant="gold" disabled={isSubmitting}>
                  {isSubmitting ? t("creating") : t("createEvent")}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
