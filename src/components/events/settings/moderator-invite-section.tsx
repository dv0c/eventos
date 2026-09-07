"use client";

import { Copy, UsersRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface ModeratorInviteSectionProps {
  eventId: string;
  onManageCollaborators: () => void;
}

export function ModeratorInviteSection({
  eventId,
  onManageCollaborators,
}: ModeratorInviteSectionProps) {
  const t = useTranslations("eventWorkspace.settings");
  const locale = useLocale();

  const modAppPath = `/mod/${eventId}`;
  const modAppUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}${modAppPath}`
      : `/${locale}${modAppPath}`;

  async function copyModLink() {
    try {
      const absolute =
        typeof window !== "undefined"
          ? `${window.location.origin}/${locale}${modAppPath}`
          : modAppUrl;
      await navigator.clipboard.writeText(absolute);
      toast.success(t("modLinkCopied"));
    } catch {
      toast.error(t("modLinkCopyFailed"));
    }
  }

  return (
    <div className="space-y-5 border-t border-border/50 pt-6 dark:border-white/10">
      <div>
        <h2 className="text-base font-semibold">{t("modInvitesTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("modInvitesDesc")}</p>
      </div>

      <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-4">
        <p className="text-sm font-medium">{t("modAppLink")}</p>
        <p className="text-xs text-muted-foreground">{t("modAccountRequired")}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-background px-3 py-2 text-xs">
            {`/${locale}${modAppPath}`}
          </code>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => void copyModLink()}>
            <Copy className="h-3.5 w-3.5" />
            {t("copyModLink")}
          </Button>
        </div>
      </div>

      <Button type="button" variant="gold" className="gap-1.5" onClick={onManageCollaborators}>
        <UsersRound className="h-4 w-4" />
        {t("openCollaborators")}
      </Button>
    </div>
  );
}
