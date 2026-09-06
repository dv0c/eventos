"use client";

import { Copy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { CollaboratorsListSkeleton } from "@/components/dashboard/org-skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CollaboratorRow {
  id: string;
  email: string;
  role: string;
  status: string;
}

export function ModeratorInviteSection({ eventId }: { eventId: string }) {
  const t = useTranslations("eventWorkspace.settings");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [rows, setRows] = useState<CollaboratorRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const modAppPath = `/mod/${eventId}`;
  const modAppUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}${modAppPath}`
      : `/${locale}${modAppPath}`;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/collaborators`);
      if (!response.ok) {
        toast.error(t("collaboratorsLoadFailed"));
        setIsLoading(false);
        return;
      }
      const json = await response.json();
      const all = (json.data.collaborators ?? []) as CollaboratorRow[];
      setRows(all.filter((row) => row.role === "EDITOR"));
    } catch {
      toast.error(t("collaboratorsLoadFailed"));
    }
    setIsLoading(false);
  }, [eventId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function invite() {
    const trimmed = email.trim();
    if (!trimmed) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/events/${eventId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, role: "EDITOR" }),
      });
      if (!response.ok) {
        toast.error(t("inviteFailed"));
        setIsSaving(false);
        return;
      }
      toast.success(t("inviteSent"));
      setEmail("");
      await load();
    } catch {
      toast.error(t("inviteFailed"));
    }
    setIsSaving(false);
  }

  async function remove(id: string) {
    try {
      const response = await fetch(`/api/events/${eventId}/collaborators/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error(t("removeFailed"));
        return;
      }
      toast.success(t("removed"));
      await load();
    } catch {
      toast.error(t("removeFailed"));
    }
  }

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="modInviteEmail">{t("inviteEmail")}</Label>
          <Input
            id="modInviteEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            disabled={isSaving}
          />
        </div>
        <Button
          type="button"
          variant="gold"
          disabled={isSaving || !email.trim()}
          onClick={() => void invite()}
        >
          {isSaving ? tCommon("loading") : t("inviteModerator")}
        </Button>
      </div>

      {isLoading ? (
        <CollaboratorsListSkeleton />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">{t("collaboratorCol")}</th>
                <th className="px-4 py-3 font-medium">{t("roleCol")}</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-muted-foreground">
                    {t("noModerators")}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-border/60">
                    <td className="px-4 py-3">
                      <div>{row.email}</div>
                      {row.status === "PENDING" ? (
                        <div className="text-xs text-muted-foreground">{t("pendingInvite")}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{t("roleEditor")}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void remove(row.id)}
                      >
                        {tCommon("delete")}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
