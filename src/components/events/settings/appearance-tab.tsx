"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import {
  DashedUploadBox,
  SegmentedControl,
  SettingsRow,
} from "@/components/events/settings/settings-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type {
  AppearanceCaptionTheme,
  AppearanceDisplayLanguage,
  AppearanceSettings,
} from "@/server/events/wall-settings";
import { getAppearanceFromSections } from "@/server/events/wall-settings";
import type { EventWithRelations } from "@/server/repositories/event.repository";

export function AppearanceTab({ event }: { event: EventWithRelations }) {
  const t = useTranslations("eventWorkspace.settings");
  const tCommon = useTranslations("common");
  const [isSaving, setIsSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(event.theme?.logoUrl ?? null);
  const [albumBackgroundUrl, setAlbumBackgroundUrl] = useState(
    event.theme?.albumBackgroundUrl ?? null,
  );
  const [primaryColor, setPrimaryColor] = useState(
    event.theme?.primaryColor ?? "#8B5CF6",
  );
  const [appearance, setAppearance] = useState<AppearanceSettings>(() =>
    getAppearanceFromSections(event.settings?.sections),
  );
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [welcomeTitle, setWelcomeTitle] = useState(appearance.welcomeScreenTitle ?? "");
  const [welcomeMessage, setWelcomeMessage] = useState(
    appearance.welcomeScreenMessage ?? "",
  );

  async function patchAppearance(patch: Partial<AppearanceSettings>) {
    const previous = appearance;
    const next = { ...appearance, ...patch };
    setAppearance(next);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/events/${event.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appearance: patch }),
      });
      if (!response.ok) {
        toast.error(t("saveFailed"));
        setAppearance(previous);
        setIsSaving(false);
        return;
      }
      const json = await response.json();
      if (json.data?.settings?.appearance) setAppearance(json.data.settings.appearance);
    } catch {
      toast.error(t("saveFailed"));
      setAppearance(previous);
    }
    setIsSaving(false);
  }

  async function patchTheme(patch: {
    primaryColor?: string;
    logoUrl?: string | null;
    albumBackgroundUrl?: string | null;
  }) {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: patch }),
      });
      if (!response.ok) {
        toast.error(t("saveFailed"));
        setIsSaving(false);
        return;
      }
    } catch {
      toast.error(t("saveFailed"));
    }
    setIsSaving(false);
  }

  async function uploadImage(
    file: File,
    folder: string,
    onUrl: (url: string) => void,
    themeKey: "logoUrl" | "albumBackgroundUrl",
  ) {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadResponse.ok) {
        toast.error(t("uploadFailed"));
        setIsSaving(false);
        return;
      }
      const uploadJson = await uploadResponse.json();
      const url = uploadJson.data.url as string;
      onUrl(url);
      await patchTheme({ [themeKey]: url });
    } catch {
      toast.error(t("uploadFailed"));
    }
    setIsSaving(false);
  }

  return (
    <div>
      <SettingsRow title={t("eventLogo")} description={t("eventLogoDesc")}>
        <DashedUploadBox
          label={t("upload")}
          previewUrl={logoUrl}
          disabled={isSaving}
          onFile={(file) =>
            void uploadImage(file, "event-logos", setLogoUrl, "logoUrl")
          }
        />
      </SettingsRow>

      <SettingsRow title={t("displayLanguage")} description={t("displayLanguageDesc")}>
        <Select
          value={appearance.displayLanguage}
          disabled={isSaving}
          onValueChange={(value) =>
            void patchAppearance({
              displayLanguage: value as AppearanceDisplayLanguage,
            })
          }
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="automatic">{t("langAutomatic")}</SelectItem>
            <SelectItem value="en">{t("langEn")}</SelectItem>
            <SelectItem value="el">{t("langEl")}</SelectItem>
          </SelectContent>
        </Select>
      </SettingsRow>

      <SettingsRow title={t("themeColor")} description={t("themeColorDesc")}>
        <input
          type="color"
          value={primaryColor}
          disabled={isSaving}
          onChange={(e) => {
            setPrimaryColor(e.target.value);
            void patchTheme({ primaryColor: e.target.value });
          }}
          className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent"
        />
      </SettingsRow>

      <SettingsRow title={t("welcomeScreen")} description={t("welcomeScreenDesc")}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setWelcomeOpen(true)}
        >
          {appearance.welcomeScreenEnabled ? t("editWelcomeScreen") : t("addWelcomeScreen")}
        </Button>
      </SettingsRow>

      <SettingsRow
        title={t("removeBranding")}
        description={t("removeBrandingDesc")}
        badge="pro"
      >
        <Switch
          checked={appearance.removeBranding}
          disabled={isSaving}
          onCheckedChange={(checked) => void patchAppearance({ removeBranding: checked })}
        />
      </SettingsRow>

      <SettingsRow title={t("albumBackground")} description={t("albumBackgroundDesc")}>
        <DashedUploadBox
          label={t("change")}
          previewUrl={albumBackgroundUrl}
          disabled={isSaving}
          onFile={(file) =>
            void uploadImage(
              file,
              "album-backgrounds",
              setAlbumBackgroundUrl,
              "albumBackgroundUrl",
            )
          }
        />
      </SettingsRow>

      <SettingsRow title={t("captionTheme")} description={t("captionThemeDesc")}>
        <SegmentedControl<AppearanceCaptionTheme>
          value={appearance.captionTheme}
          onChange={(value) => void patchAppearance({ captionTheme: value })}
          options={[
            { value: "dark", label: t("captionDark") },
            { value: "light", label: t("captionLight") },
          ]}
        />
      </SettingsRow>

      <Dialog open={welcomeOpen} onOpenChange={setWelcomeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("welcomeScreen")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="welcomeTitle">{t("welcomeTitle")}</Label>
              <Input
                id="welcomeTitle"
                value={welcomeTitle}
                onChange={(e) => setWelcomeTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="welcomeMessage">{t("welcomeMessage")}</Label>
              <Input
                id="welcomeMessage"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void patchAppearance({
                  welcomeScreenEnabled: false,
                  welcomeScreenTitle: null,
                  welcomeScreenMessage: null,
                });
                setWelcomeOpen(false);
              }}
            >
              {t("removeWelcome")}
            </Button>
            <Button
              type="button"
              variant="gold"
              onClick={() => {
                void patchAppearance({
                  welcomeScreenEnabled: true,
                  welcomeScreenTitle: welcomeTitle || null,
                  welcomeScreenMessage: welcomeMessage || null,
                });
                setWelcomeOpen(false);
                toast.success(tCommon("save"));
              }}
            >
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
