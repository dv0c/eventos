"use client";

import { OrgRole } from "@prisma/client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INVITE_ROLES = [OrgRole.ADMIN, OrgRole.EDITOR, OrgRole.VIEWER] as const;

export function InviteMemberForm() {
  const t = useTranslations("team");
  const tErrors = useTranslations("errors");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>(OrgRole.VIEWER);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/organizations/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error?.message ?? tErrors("generic"));
        setIsLoading(false);
        return;
      }

      toast.success(t("inviteSent"));
      setEmail("");
      setRole(OrgRole.VIEWER);
      setIsLoading(false);
    } catch {
      toast.error(tErrors("networkError"));
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="invite-email">{t("email")}</Label>
        <Input
          id="invite-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@example.com"
          disabled={isLoading}
        />
      </div>
      <div className="w-full space-y-2 sm:w-40">
        <Label htmlFor="invite-role">{t("role")}</Label>
        <Select
          value={role}
          onValueChange={(value) => setRole(value as OrgRole)}
          disabled={isLoading}
        >
          <SelectTrigger id="invite-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INVITE_ROLES.map((inviteRole) => (
              <SelectItem key={inviteRole} value={inviteRole}>
                {inviteRole}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" variant="gold" disabled={isLoading}>
        {isLoading ? t("inviting") : t("inviteMember")}
      </Button>
    </form>
  );
}
