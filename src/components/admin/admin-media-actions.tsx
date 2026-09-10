"use client";

import { MediaStatus } from "@prisma/client";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function AdminMediaActions({
  id,
  kind = "media",
}: {
  id: string;
  kind?: "media" | "wish";
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(action: "approve" | "reject" | "feature" | "delete") {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, kind }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        toast.error(json?.error?.message ?? t("saveFailed"));
        return;
      }
      toast.success(t("actionDone"));
      router.refresh();
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (kind === "wish") {
    return (
      <Button
        size="sm"
        variant="destructive"
        disabled={busy}
        onClick={() => void run("delete")}
      >
        {t("delete")}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      <Button size="sm" variant="outline" disabled={busy} onClick={() => void run("approve")}>
        {t("approve")}
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => void run("reject")}>
        {t("reject")}
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => void run("feature")}>
        {t("feature")}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={busy}
        onClick={() => void run("delete")}
      >
        {t("delete")}
      </Button>
    </div>
  );
}

export function mediaStatusLabel(status: MediaStatus) {
  return status;
}
