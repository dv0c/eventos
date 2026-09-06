"use client";

import { OrgMode } from "@prisma/client";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { DashedUploadBox } from "@/components/events/settings/settings-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OrgBrandingForm({
  organizationId,
  mode,
  initialName,
  initialBrandName,
  initialLogoUrl,
  initialPrimaryColor,
  initialSecondaryColor,
  canManage,
}: {
  organizationId: string;
  mode: OrgMode;
  initialName: string;
  initialBrandName: string | null;
  initialLogoUrl: string | null;
  initialPrimaryColor: string | null;
  initialSecondaryColor: string | null;
  canManage: boolean;
}) {
  const t = useTranslations("settings");
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [name, setName] = useState(initialName);
  const [brandName, setBrandName] = useState(initialBrandName ?? "");
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor ?? "#c9a227");
  const [secondaryColor, setSecondaryColor] = useState(initialSecondaryColor ?? "#8b7355");
  const [isSaving, setIsSaving] = useState(false);
  const isB2B = mode === OrgMode.B2B;

  async function patch(body: Record<string, unknown>, successKey: string) {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const json = await response.json().catch(() => null);
        toast.error(json?.error?.message ?? t("saveFailed"));
        return false;
      }
      toast.success(t(successKey));
      router.refresh();
      return true;
    } catch {
      toast.error(t("saveFailed"));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function convertToB2B() {
    await patch({ mode: "B2B" }, "convertedToB2B");
  }

  async function saveBranding() {
    await patch(
      {
        name: name.trim(),
        brandName: brandName.trim() || null,
        primaryColor,
        secondaryColor,
        logoUrl,
      },
      "brandingSaved",
    );
  }

  async function patchLogo(nextUrl: string | null) {
    const previous = logoUrl;
    setLogoUrl(nextUrl);
    const ok = await patch({ logoUrl: nextUrl }, isB2B ? "brandingSaved" : "watermarkSaved");
    if (!ok) setLogoUrl(previous);
  }

  async function uploadLogo(file: File) {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "org-logos");
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadResponse.ok) {
        toast.error(t("uploadFailed"));
        return;
      }
      const uploadJson = await uploadResponse.json();
      const url = uploadJson.data.url as string;
      await patchLogo(url);
    } catch {
      toast.error(t("uploadFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  if (!canManage) {
    return (
      <p className="text-sm text-muted-foreground">{t("brandingReadOnly")}</p>
    );
  }

  if (!isB2B) {
    return (
      <div className="space-y-4 border-t border-border/50 pt-4 dark:border-white/10">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{t("convertToB2B")}</h3>
          <p className="text-sm text-muted-foreground">{t("convertToB2BDesc")}</p>
        </div>
        <Button
          type="button"
          variant="gold"
          disabled={isSaving}
          onClick={() => void convertToB2B()}
        >
          {t("convertToB2BCta")}
        </Button>

        <div className="space-y-3 border-t border-border/50 pt-4 dark:border-white/10">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">{t("watermark")}</h3>
            <p className="text-sm text-muted-foreground">{t("watermarkDesc")}</p>
          </div>
          <div className="flex items-end gap-3">
            <DashedUploadBox
              label={t("upload")}
              previewUrl={logoUrl}
              disabled={isSaving}
              onFile={(file) => void uploadLogo(file)}
            />
            {logoUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isSaving}
                onClick={() => void patchLogo(null)}
              >
                {t("removeWatermark")}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 border-t border-border/50 pt-4 dark:border-white/10">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{t("whitelabel")}</h3>
        <p className="text-sm text-muted-foreground">{t("whitelabelDesc")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="org-name">{t("orgName")}</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brand-name">{t("brandName")}</Label>
          <Input
            id="brand-name"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder={t("brandNamePlaceholder")}
            disabled={isSaving}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="primary-color">{t("primaryColor")}</Label>
          <Input
            id="primary-color"
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            disabled={isSaving}
            className="h-10 w-full cursor-pointer p-1"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="secondary-color">{t("secondaryColor")}</Label>
          <Input
            id="secondary-color"
            type="color"
            value={secondaryColor}
            onChange={(e) => setSecondaryColor(e.target.value)}
            disabled={isSaving}
            className="h-10 w-full cursor-pointer p-1"
          />
        </div>
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-medium">{t("appLogo")}</h4>
        <p className="text-sm text-muted-foreground">{t("appLogoDesc")}</p>
      </div>
      <div className="flex items-end gap-3">
        <DashedUploadBox
          label={t("upload")}
          previewUrl={logoUrl}
          disabled={isSaving}
          onFile={(file) => void uploadLogo(file)}
        />
        {logoUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isSaving}
            onClick={() => void patchLogo(null)}
          >
            {t("removeWatermark")}
          </Button>
        ) : null}
      </div>

      <Button type="button" variant="gold" disabled={isSaving} onClick={() => void saveBranding()}>
        {t("saveBranding")}
      </Button>
    </div>
  );
}
