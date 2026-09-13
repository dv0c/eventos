"use client";

import { EventStatus, EventType } from "@prisma/client";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const STATUSES = Object.values(EventStatus);
const TYPES = Object.values(EventType);

export function AdminEventEditor({
  event,
}: {
  event: {
    id: string;
    name: string;
    status: EventStatus;
    type: EventType;
    description: string | null;
    date: Date;
    endDate: Date | null;
    startTime: string | null;
    endTime: string | null;
    location: string | null;
    address: string | null;
    hostName: string | null;
    hostEmail: string | null;
    hostPhone: string | null;
    deletedAt: Date | null;
    settings: {
      isPublic: boolean;
      enableGallery: boolean;
      enableWall: boolean;
      enableVoiceWishes: boolean;
      enableSongRequests: boolean;
      requireManualApproval: boolean;
    } | null;
    theme: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
    } | null;
  };
}) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: event.name,
    status: event.status,
    type: event.type,
    description: event.description ?? "",
    date: event.date.toISOString().slice(0, 10),
    endDate: event.endDate ? event.endDate.toISOString().slice(0, 10) : "",
    startTime: event.startTime ?? "",
    endTime: event.endTime ?? "",
    location: event.location ?? "",
    address: event.address ?? "",
    hostName: event.hostName ?? "",
    hostEmail: event.hostEmail ?? "",
    hostPhone: event.hostPhone ?? "",
  });
  const [settings, setSettings] = useState({
    isPublic: event.settings?.isPublic ?? false,
    enableGallery: event.settings?.enableGallery ?? true,
    enableWall: event.settings?.enableWall ?? true,
    enableVoiceWishes: event.settings?.enableVoiceWishes ?? true,
    enableSongRequests: event.settings?.enableSongRequests ?? true,
    requireManualApproval: event.settings?.requireManualApproval ?? false,
  });
  const [theme, setTheme] = useState({
    primaryColor: event.theme?.primaryColor ?? "#C4A574",
    secondaryColor: event.theme?.secondaryColor ?? "#F59E0B",
    accentColor: event.theme?.accentColor ?? "#E8C9A0",
  });

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        toast.error(json?.error?.message ?? t("saveFailed"));
        return;
      }
      toast.success(tCommon("save"));
      router.refresh();
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl border border-white/10 bg-black/30 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t("name")}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("status")}</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, status: v as EventStatus }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("type")}</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v as EventType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(
            [
              ["date", t("date")],
              ["endDate", t("endDate")],
              ["startTime", t("startTime")],
              ["endTime", t("endTime")],
              ["location", t("location")],
              ["address", t("address")],
              ["hostName", t("hostName")],
              ["hostEmail", t("hostEmail")],
              ["hostPhone", t("hostPhone")],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label>{label}</Label>
              <Input
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t("description")}</Label>
            <Input
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="gold"
            disabled={saving}
            onClick={() =>
              void patch({
                ...form,
                description: form.description || null,
                endDate: form.endDate || undefined,
                location: form.location || null,
                address: form.address || null,
                hostName: form.hostName || null,
                hostEmail: form.hostEmail || null,
                hostPhone: form.hostPhone || null,
                settings,
                theme,
              })
            }
          >
            {tCommon("save")}
          </Button>
          {event.deletedAt ? (
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => void patch({ restore: true })}
            >
              {t("restore")}
            </Button>
          ) : (
            <Button
              variant="destructive"
              disabled={saving}
              onClick={() => void patch({ softDelete: true })}
            >
              {t("softDelete")}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-4">
        <h3 className="font-semibold">{t("settings")}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            Object.keys(settings) as Array<keyof typeof settings>
          ).map((key) => (
            <label key={key} className="flex items-center justify-between gap-3 text-sm">
              <span>{key}</span>
              <Switch
                checked={settings[key]}
                onCheckedChange={(checked) =>
                  setSettings((s) => ({ ...s, [key]: checked }))
                }
              />
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-4">
        <h3 className="font-semibold">{t("theme")}</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["primaryColor", t("primaryColor")],
              ["secondaryColor", t("secondaryColor")],
              ["accentColor", t("accentColor")],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label>{label}</Label>
              <Input
                value={theme[key]}
                onChange={(e) => setTheme((th) => ({ ...th, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
