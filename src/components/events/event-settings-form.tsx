"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { EventPageHeader } from "@/components/events/event-page-header";
import { EventSection } from "@/components/events/event-section";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import type { EventWithRelations } from "@/server/repositories/event.repository";

interface EventSettingsFormProps {
  event: EventWithRelations;
}

export function EventSettingsForm({ event }: EventSettingsFormProps) {
  const t = useTranslations("events");
  const tVisibility = useTranslations("events.settingsVisibility");
  const tCommon = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisibilityLoading, setIsVisibilityLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(event.settings?.isPublic ?? false);
  const [enableGallery, setEnableGallery] = useState(
    event.settings?.enableGallery ?? false,
  );
  const [enableWall, setEnableWall] = useState(event.settings?.enableWall ?? false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const body = {
      name: formData.get("name") as string,
      location: formData.get("location") as string,
      description: formData.get("description") as string,
      date: formData.get("date") as string,
      startTime: formData.get("startTime") as string,
      hostName: formData.get("hostName") as string,
      hostEmail: formData.get("hostEmail") as string,
      hostPhone: formData.get("hostPhone") as string,
    };

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        toast.error(t("saveFailed"));
        setIsLoading(false);
        return;
      }

      toast.success(tCommon("save"));
    } catch {
      toast.error(t("saveFailed"));
    }

    setIsLoading(false);
  }

  async function handleVisibilitySave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsVisibilityLoading(true);

    try {
      const response = await fetch(`/api/events/${event.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic, enableGallery, enableWall }),
      });

      if (!response.ok) {
        toast.error(t("saveFailed"));
        setIsVisibilityLoading(false);
        return;
      }

      toast.success(tCommon("save"));
    } catch {
      toast.error(t("saveFailed"));
    }

    setIsVisibilityLoading(false);
  }

  const dateStr = event.date.toISOString().split("T")[0];
  const publicPath = `/e/${event.slug}`;

  return (
    <div className="space-y-6">
      <EventPageHeader title={t("settings")} />

      <EventSection title={tVisibility("visibility")} className="max-w-2xl">
        <form onSubmit={handleVisibilitySave} className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="isPublic"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked === true)}
            />
            <Label htmlFor="isPublic" className="cursor-pointer">
              {tVisibility("isPublic")}
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="enableGallery"
              checked={enableGallery}
              onCheckedChange={(checked) => setEnableGallery(checked === true)}
            />
            <Label htmlFor="enableGallery" className="cursor-pointer">
              {tVisibility("enableGallery")}
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="enableWall"
              checked={enableWall}
              onCheckedChange={(checked) => setEnableWall(checked === true)}
            />
            <Label htmlFor="enableWall" className="cursor-pointer">
              {tVisibility("enableWall")}
            </Label>
          </div>

          {isPublic ? (
            <div className="rounded-xl bg-secondary/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">{tVisibility("publicUrl")}</p>
              <Link
                href={publicPath}
                target="_blank"
                className="text-sm font-medium hover:underline"
              >
                {publicPath}
              </Link>
            </div>
          ) : null}

          <Button type="submit" variant="gold" disabled={isVisibilityLoading}>
            {isVisibilityLoading ? tCommon("loading") : tCommon("save")}
          </Button>
        </form>
      </EventSection>

      <EventSection title={t("details")} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input id="name" name="name" defaultValue={event.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t("description")}</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={event.description ?? ""}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">{t("date")}</Label>
              <Input id="date" name="date" type="date" defaultValue={dateStr} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">{t("time")}</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                defaultValue={event.startTime ?? ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">{t("location")}</Label>
            <Input
              id="location"
              name="location"
              defaultValue={event.location ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hostName">{t("hostName")}</Label>
            <Input
              id="hostName"
              name="hostName"
              defaultValue={event.hostName ?? ""}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hostEmail">{t("hostEmail")}</Label>
              <Input
                id="hostEmail"
                name="hostEmail"
                type="email"
                defaultValue={event.hostEmail ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostPhone">{t("hostPhone")}</Label>
              <Input
                id="hostPhone"
                name="hostPhone"
                defaultValue={event.hostPhone ?? ""}
              />
            </div>
          </div>
          <Button type="submit" variant="gold" disabled={isLoading}>
            {isLoading ? tCommon("loading") : tCommon("save")}
          </Button>
        </form>
      </EventSection>
    </div>
  );
}
