"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { CollaboratorsListSkeleton } from "@/components/dashboard/org-skeletons";
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
import type { EventWithRelations } from "@/server/repositories/event.repository";

interface CollaboratorRow {
  id: string;
  email: string;
  role: string;
  status: string;
}

export function CollaboratorsTab({ event }: { event: EventWithRelations }) {
  const t = useTranslations("eventWorkspace.settings");
  const tCommon = useTranslations("common");
  const [rows, setRows] = useState<CollaboratorRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${event.id}/collaborators`);
      if (!response.ok) {
        toast.error(t("collaboratorsLoadFailed"));
        setIsLoading(false);
        return;
      }
      const json = await response.json();
      setRows(json.data.collaborators ?? []);
    } catch {
      toast.error(t("collaboratorsLoadFailed"));
    }
    setIsLoading(false);
  }, [event.id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function invite() {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/events/${event.id}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (!response.ok) {
        toast.error(t("inviteFailed"));
        setIsSaving(false);
        return;
      }
      toast.success(t("inviteSent"));
      setInviteOpen(false);
      setEmail("");
      setRole("EDITOR");
      await load();
    } catch {
      toast.error(t("inviteFailed"));
    }
    setIsSaving(false);
  }

  async function remove(id: string) {
    try {
      const response = await fetch(`/api/events/${event.id}/collaborators/${id}`, {
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

  function roleLabel(value: string) {
    if (value === "OWNER") return t("roleOwner");
    if (value === "VIEWER") return t("roleViewer");
    return t("roleEditor");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">{t("collaboratorsTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("collaboratorsDesc")}</p>
        </div>
        <Button type="button" variant="gold" onClick={() => setInviteOpen(true)}>
          {t("inviteCollaborator")}
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
                    {t("noCollaborators")}
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
                    <td className="px-4 py-3">{roleLabel(row.role)}</td>
                    <td className="px-4 py-3 text-right">
                      {row.role !== "OWNER" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void remove(row.id)}
                        >
                          {tCommon("delete")}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("inviteCollaborator")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="collabEmail">{t("inviteEmail")}</Label>
              <Input
                id="collabEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="collabRole">{t("inviteRole")}</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as "EDITOR" | "VIEWER")}
              >
                <SelectTrigger id="collabRole" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EDITOR">
                    <div className="flex flex-col items-start gap-0.5">
                      <span>{t("roleEditor")}</span>
                      <span className="text-xs text-muted-foreground">{t("roleEditorDesc")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="VIEWER">
                    <div className="flex flex-col items-start gap-0.5">
                      <span>{t("roleViewer")}</span>
                      <span className="text-xs text-muted-foreground">{t("roleViewerDesc")}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="gold"
              disabled={isSaving || !email}
              onClick={() => void invite()}
            >
              {isSaving ? tCommon("loading") : t("sendInvite")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
