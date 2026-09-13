"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { EVENTOS_DEFAULT_THEME } from "@/components/events/event-theme-scope";
import {
  ThemeStudioDialog,
  type ThemeColors,
} from "@/components/events/settings/theme-studio-dialog";
import {
  DashedUploadBox,
  SegmentedControl,
  SettingsRow,
} from "@/components/events/settings/settings-ui";
import { MediaUploadModal } from "@/components/media/media-upload-modal";
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
  const [themeColors, setThemeColors] = useState<ThemeColors>({
    primaryColor:
      event.theme?.primaryColor ?? EVENTOS_DEFAULT_THEME.primaryColor,
    secondaryColor:
      event.theme?.secondaryColor ?? EVENTOS_DEFAULT_THEME.secondaryColor,
    accentColor: event.theme?.accentColor ?? EVENTOS_DEFAULT_THEME.accentColor,
  });
  const [themeOpen, setThemeOpen] = useState(false);
  const [logoUploadOpen, setLogoUploadOpen] = useState(false);
  const [albumBgUploadOpen, setAlbumBgUploadOpen] = useState(false);
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
    secondaryColor?: string;
    accentColor?: string;
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

  async function applyUploadedThemeImage(
    themeKey: "logoUrl" | "albumBackgroundUrl",
    onUrl: (url: string) => void,
    response: unknown,
  ) {
    const url = (response as { data?: { url?: string } } | undefined)?.data?.url;
    if (!url) {
      toast.error(t("uploadFailed"));
      return;
    }
    onUrl(url);
    await patchTheme({ [themeKey]: url });
  }

  return (
    <div>
      <SettingsRow title={t("eventLogo")} description={t("eventLogoDesc")}>
        <DashedUploadBox
          label={t("upload")}
          previewUrl={logoUrl}
          disabled={isSaving}
          removeLabel={t("removeLogo")}
          onOpen={() => setLogoUploadOpen(true)}
          onRemove={() => {
            setLogoUrl(null);
            void patchTheme({ logoUrl: null });
          }}
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
        <div className="flex items-center gap-3">
          <div className="flex -space-x-1.5">
            <span
              className="size-8 rounded-full border border-white/30 shadow-sm"
              style={{ backgroundColor: themeColors.primaryColor }}
            />
            <span
              className="size-8 rounded-full border border-white/30 shadow-sm"
              style={{ backgroundColor: themeColors.secondaryColor }}
            />
            <span
              className="size-8 rounded-full border border-white/30 shadow-sm"
              style={{ backgroundColor: themeColors.accentColor }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSaving}
            onClick={() => setThemeOpen(true)}
          >
            {t("customizeTheme")}
          </Button>
        </div>
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
          removeLabel={t("removeAlbumBackground")}
          onOpen={() => setAlbumBgUploadOpen(true)}
          onRemove={() => {
            setAlbumBackgroundUrl(null);
            void patchTheme({ albumBackgroundUrl: null });
          }}
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

      <ThemeStudioDialog
        open={themeOpen}
        onOpenChange={setThemeOpen}
        value={themeColors}
        saving={isSaving}
        onSave={async (colors) => {
          const ok = await patchTheme(colors);
          if (!ok) return;
          setThemeColors(colors);
          setThemeOpen(false);
          toast.success(tCommon("save"));
        }}
      />

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

      <MediaUploadModal
        open={logoUploadOpen}
        onOpenChange={setLogoUploadOpen}
        title={t("eventLogo")}
        description={t("eventLogoDesc")}
        mode="single"
        maxBytes={5 * 1024 * 1024}
        upload={{
          url: "/api/upload",
          buildFormData: (file) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", "event-logos");
            return formData;
          },
        }}
        onSuccess={async ({ files }) => {
          await applyUploadedThemeImage("logoUrl", setLogoUrl, files[0]?.response);
        }}
      />

      <MediaUploadModal
        open={albumBgUploadOpen}
        onOpenChange={setAlbumBgUploadOpen}
        title={t("albumBackground")}
        description={t("albumBackgroundDesc")}
        mode="single"
        maxBytes={5 * 1024 * 1024}
        upload={{
          url: "/api/upload",
          buildFormData: (file) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", "album-backgrounds");
            return formData;
          },
        }}
        onSuccess={async ({ files }) => {
          await applyUploadedThemeImage(
            "albumBackgroundUrl",
            setAlbumBackgroundUrl,
            files[0]?.response,
          );
        }}
      />
    </div>
  );
}
