"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { SettingsRow } from "@/components/events/settings/settings-ui";
import { ModeratorInviteSection } from "@/components/events/settings/moderator-invite-section";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { AlbumPermission, ModerationSettings } from "@/server/events/wall-settings";
import {
  clampAnnouncementDurationSec,
  getModerationFromSections,
  type ModerationSettingsPatch,
} from "@/server/events/wall-settings";
import type { EventWithRelations } from "@/server/repositories/event.repository";

export function ModerationTab({
  event,
  onManageCollaborators,
}: {
  event: EventWithRelations;
  onManageCollaborators: () => void;
}) {
  const t = useTranslations("eventWorkspace.settings");
  const [isSaving, setIsSaving] = useState(false);
  const [enableVoiceWishes, setEnableVoiceWishes] = useState(
    event.settings?.enableVoiceWishes ?? true,
  );
  const [enableSongRequests, setEnableSongRequests] = useState(
    event.settings?.enableSongRequests ?? true,
  );
  const [isPublic, setIsPublic] = useState(event.settings?.isPublic ?? true);
  const [enableWall, setEnableWall] = useState(event.settings?.enableWall ?? true);
  const [moderation, setModeration] = useState<ModerationSettings>(() => {
    const fromSections = getModerationFromSections(event.settings?.sections);
    return {
      ...fromSections,
      requireManualApproval:
        event.settings?.requireManualApproval ?? fromSections.requireManualApproval,
    };
  });

  async function patchColumns(body: Record<string, unknown>) {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/events/${event.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        toast.error(t("saveFailed"));
        setIsSaving(false);
        return false;
      }
      setIsSaving(false);
      return true;
    } catch {
      toast.error(t("saveFailed"));
      setIsSaving(false);
      return false;
    }
  }

  async function patchVoiceWishes(checked: boolean) {
    const previous = enableVoiceWishes;
    setEnableVoiceWishes(checked);
    const ok = await patchColumns({ enableVoiceWishes: checked });
    if (!ok) setEnableVoiceWishes(previous);
  }

  async function patchSongRequests(checked: boolean) {
    const previous = enableSongRequests;
    setEnableSongRequests(checked);
    const ok = await patchColumns({ enableSongRequests: checked });
    if (!ok) setEnableSongRequests(previous);
  }

  async function patchIsPublic(checked: boolean) {
    const previous = isPublic;
    setIsPublic(checked);
    const ok = await patchColumns({ isPublic: checked });
    if (!ok) setIsPublic(previous);
  }

  async function patchEnableWall(checked: boolean) {
    const previous = enableWall;
    setEnableWall(checked);
    const ok = await patchColumns({ enableWall: checked });
    if (!ok) setEnableWall(previous);
  }

  async function patchModeration(patch: ModerationSettingsPatch) {
    const previous = moderation;
    const next = {
      ...moderation,
      ...patch,
      contentFilterConfig: {
        ...moderation.contentFilterConfig,
        ...patch.contentFilterConfig,
      },
    };
    setModeration(next);
    setIsSaving(true);

    const body: Record<string, unknown> = { moderation: patch };
    if (patch.requireManualApproval !== undefined) {
      body.requireManualApproval = patch.requireManualApproval;
    }
    if (patch.albumPermission !== undefined) {
      body.enableGallery =
        patch.albumPermission === "view_upload" || patch.albumPermission === "upload_only";
    }

    try {
      const response = await fetch(`/api/events/${event.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        toast.error(t("saveFailed"));
        setModeration(previous);
        setIsSaving(false);
        return;
      }
      const json = await response.json();
      if (json.data?.settings?.moderation) {
        setModeration({
          ...json.data.settings.moderation,
          requireManualApproval:
            json.data.settings.requireManualApproval ??
            json.data.settings.moderation.requireManualApproval,
        });
      }
    } catch {
      toast.error(t("saveFailed"));
      setModeration(previous);
    }
    setIsSaving(false);
  }

  const albumOptions: {
    value: AlbumPermission;
    titleKey: string;
    descKey: string;
  }[] = [
    {
      value: "view_upload",
      titleKey: "albumViewUpload",
      descKey: "albumViewUploadDesc",
    },
    {
      value: "view_only",
      titleKey: "albumViewOnly",
      descKey: "albumViewOnlyDesc",
    },
    {
      value: "upload_only",
      titleKey: "albumUploadOnly",
      descKey: "albumUploadOnlyDesc",
    },
  ];

  return (
    <div>
      <SettingsRow title={t("isPublic")} description={t("isPublicDesc")}>
        <Switch
          checked={isPublic}
          disabled={isSaving}
          onCheckedChange={(checked) => void patchIsPublic(checked)}
        />
      </SettingsRow>

      <SettingsRow title={t("enableWall")} description={t("enableWallDesc")}>
        <Switch
          checked={enableWall}
          disabled={isSaving}
          onCheckedChange={(checked) => void patchEnableWall(checked)}
        />
      </SettingsRow>

      <SettingsRow title={t("manualApproval")} description={t("manualApprovalDesc")} badge="pro">
        <Switch
          checked={moderation.requireManualApproval}
          disabled={isSaving}
          onCheckedChange={(checked) =>
            void patchModeration({ requireManualApproval: checked })
          }
        />
      </SettingsRow>

      <SettingsRow
        title={t("allowedMediaTypes")}
        description={t("allowedMediaTypesDesc")}
        badge="plus"
      >
        <div className="flex flex-col gap-2 sm:items-end">
          {(
            [
              ["allowPhotos", "mediaPhotos"],
              ["allowVideos", "mediaVideos"],
            ] as const
          ).map(([key, labelKey]) => (
            <label key={key} className="inline-flex items-center gap-2 text-sm">
              <Checkbox
                checked={moderation[key]}
                disabled={isSaving}
                onCheckedChange={(checked) =>
                  void patchModeration({ [key]: checked === true })
                }
              />
              {t(labelKey)}
            </label>
          ))}
        </div>
      </SettingsRow>

      <div className="border-b border-border/50 py-5 last:border-b-0">
        <h3 className="text-sm font-semibold">{t("albumPermissions")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("albumPermissionsDesc")}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {albumOptions.map((option) => {
            const active = moderation.albumPermission === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={isSaving}
                onClick={() => void patchModeration({ albumPermission: option.value })}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40",
                )}
              >
                <p className="text-sm font-semibold">{t(option.titleKey)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t(option.descKey)}</p>
              </button>
            );
          })}
        </div>
      </div>

      <SettingsRow
        title={t("disableGuestDownload")}
        description={t("disableGuestDownloadDesc")}
        badge="pro"
      >
        <Switch
          checked={moderation.disableGuestDownload}
          disabled={isSaving}
          onCheckedChange={(checked) =>
            void patchModeration({ disableGuestDownload: checked })
          }
        />
      </SettingsRow>

      <SettingsRow title={t("disableLikes")} description={t("disableLikesDesc")}>
        <Switch
          checked={moderation.disableLikes}
          disabled={isSaving}
          onCheckedChange={(checked) => void patchModeration({ disableLikes: checked })}
        />
      </SettingsRow>

      <SettingsRow
        title={t("announcementDuration")}
        description={t("announcementDurationDesc")}
      >
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={5}
            max={60}
            step={1}
            className="h-9 w-20 text-base"
            value={moderation.announcementDurationSec}
            disabled={isSaving}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (!Number.isFinite(next)) return;
              setModeration((prev) => ({
                ...prev,
                announcementDurationSec: next,
              }));
            }}
            onBlur={() => {
              void patchModeration({
                announcementDurationSec: clampAnnouncementDurationSec(
                  moderation.announcementDurationSec,
                ),
              });
            }}
          />
          <span className="text-sm text-muted-foreground">{t("announcementDurationUnit")}</span>
        </div>
      </SettingsRow>

      <SettingsRow title={t("enableVoiceWishes")} description={t("enableVoiceWishesDesc")}>
        <Switch
          checked={enableVoiceWishes}
          disabled={isSaving}
          onCheckedChange={(checked) => void patchVoiceWishes(checked)}
        />
      </SettingsRow>

      <SettingsRow title={t("enableSongRequests")} description={t("enableSongRequestsDesc")}>
        <Switch
          checked={enableSongRequests}
          disabled={isSaving}
          onCheckedChange={(checked) => void patchSongRequests(checked)}
        />
      </SettingsRow>

      <ModeratorInviteSection
        eventId={event.id}
        onManageCollaborators={onManageCollaborators}
      />
    </div>
  );
}
