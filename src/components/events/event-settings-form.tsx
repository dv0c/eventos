"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { QrCodesPanel } from "@/components/media/qr-codes-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EventWithRelations } from "@/server/repositories/event.repository";

interface EventSettingsFormProps {
  event: EventWithRelations;
}

export function EventSettingsForm({ event }: EventSettingsFormProps) {
  const t = useTranslations("events");
  const tCommon = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);

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
        toast.error(tCommon("save") + " failed");
        setIsLoading(false);
        return;
      }

      toast.success(tCommon("save"));
    } catch {
      toast.error(tCommon("save") + " failed");
    }

    setIsLoading(false);
  }

  const dateStr = event.date.toISOString().split("T")[0];

  return (
    <div className="space-y-6">
    <Card className="surface-elevated max-w-2xl">
      <CardHeader>
        <CardTitle>{t("settings")}</CardTitle>
      </CardHeader>
      <CardContent>
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
            <Label htmlFor="hostName">Host</Label>
            <Input
              id="hostName"
              name="hostName"
              defaultValue={event.hostName ?? ""}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hostEmail">Host email</Label>
              <Input
                id="hostEmail"
                name="hostEmail"
                type="email"
                defaultValue={event.hostEmail ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostPhone">Host phone</Label>
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
      </CardContent>
    </Card>
    <QrCodesPanel eventId={event.id} />
    </div>
  );
}
