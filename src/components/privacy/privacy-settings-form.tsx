"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PrivacySettingsForm() {
  const t = useTranslations("privacy");
  const [loading, setLoading] = useState<"export" | "delete" | null>(null);

  const requestExport = async () => {
    setLoading("export");
    try {
      const res = await fetch("/api/privacy/export", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Failed");
      toast.success(t("exportStarted", { jobId: json.data.jobId }));
    } catch {
      toast.error(t("exportError"));
    } finally {
      setLoading(null);
    }
  };

  const requestDeletion = async () => {
    if (!window.confirm(t("deleteConfirm"))) return;
    setLoading("delete");
    try {
      const res = await fetch("/api/privacy/delete-account", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Failed");
      toast.success(t("deleteSuccess"));
      window.location.href = "/login";
    } catch {
      toast.error(t("deleteError"));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="surface-elevated">
        <CardHeader>
          <CardTitle>{t("exportTitle")}</CardTitle>
          <CardDescription>{t("exportDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={requestExport}
            disabled={loading !== null}
          >
            {loading === "export" ? t("exporting") : t("exportCta")}
          </Button>
        </CardContent>
      </Card>

      <Card className="surface-elevated border-destructive/30">
        <CardHeader>
          <CardTitle>{t("deleteTitle")}</CardTitle>
          <CardDescription>{t("deleteDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={requestDeletion}
            disabled={loading !== null}
          >
            {loading === "delete" ? t("deleting") : t("deleteCta")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
