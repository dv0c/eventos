"use client";

import { OrgMode } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { DashedUploadBox } from "@/components/events/settings/settings-ui";
import { MediaUploadModal } from "@/components/media/media-upload-modal";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

export function OrgBrandingForm({
  organizationId,
  mode,
  initialLogoUrl,
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
  const [isSaving, setIsSaving] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
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

  async function patchLogo(nextUrl: string | null) {
    const previous = logoUrl;
    setLogoUrl(nextUrl);
    const ok = await patch({ logoUrl: nextUrl }, "watermarkSaved");
    if (!ok) setLogoUrl(previous);
  }

  if (!canManage) {
    return (
      <p className="text-sm text-muted-foreground">{t("brandingReadOnly")}</p>
    );
  }

  return (
    <div className="space-y-4 border-t border-border/50 pt-4 dark:border-white/10">
      {isB2B ? (
        <p className="text-sm text-muted-foreground">{t("brandingManagedByEventos")}</p>
      ) : null}

      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{t("watermark")}</h3>
        <p className="text-sm text-muted-foreground">{t("watermarkDesc")}</p>
      </div>
      <div className="flex items-end gap-3">
        <DashedUploadBox
          label={t("upload")}
          previewUrl={logoUrl}
          disabled={isSaving}
          onOpen={() => setUploadOpen(true)}
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

      <MediaUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title={t("watermark")}
        description={t("watermarkDesc")}
        mode="single"
        maxBytes={5 * 1024 * 1024}
        upload={{
          url: "/api/upload",
          buildFormData: (file) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", "org-logos");
            return formData;
          },
        }}
        onSuccess={async ({ files }) => {
          const response = files[0]?.response as
            | { data?: { url?: string } }
            | undefined;
          const url = response?.data?.url;
          if (!url) {
            toast.error(t("uploadFailed"));
            return;
          }
          await patchLogo(url);
        }}
      />
    </div>
  );
}
