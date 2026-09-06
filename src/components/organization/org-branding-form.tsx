"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { DashedUploadBox } from "@/components/events/settings/settings-ui";
import { Button } from "@/components/ui/button";

export function OrgBrandingForm({
  organizationId,
  initialLogoUrl,
}: {
  organizationId: string;
  initialLogoUrl: string | null;
}) {
  const t = useTranslations("settings");
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [isSaving, setIsSaving] = useState(false);

  async function patchLogo(nextUrl: string | null) {
    const previous = logoUrl;
    setLogoUrl(nextUrl);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: nextUrl }),
      });
      if (!response.ok) {
        setLogoUrl(previous);
        toast.error(t("saveFailed"));
        return false;
      }
      toast.success(t("watermarkSaved"));
      return true;
    } catch {
      setLogoUrl(previous);
      toast.error(t("saveFailed"));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadWatermark(file: File) {
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

  return (
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
          onFile={(file) => void uploadWatermark(file)}
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
  );
}
