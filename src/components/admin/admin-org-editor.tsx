"use client";

import { OrgMode, OrgRole } from "@prisma/client";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
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

type PlanOption = { id: string; name: string; slug: string };

type Member = {
  id: string;
  role: OrgRole;
  user: { id: string; email: string; name: string | null };
};

export function AdminOrgEditor({
  organization,
  plans,
  members,
}: {
  organization: {
    id: string;
    name: string;
    slug: string;
    mode: OrgMode;
    brandName: string | null;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    customDomain: string | null;
    planId: string;
    deletedAt: Date | null;
    stripeCustomerId: string | null;
  };
  plans: PlanOption[];
  members: Member[];
}) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: organization.name,
    slug: organization.slug,
    mode: organization.mode,
    brandName: organization.brandName ?? "",
    logoUrl: organization.logoUrl ?? "",
    primaryColor: organization.primaryColor ?? "",
    secondaryColor: organization.secondaryColor ?? "",
    customDomain: organization.customDomain ?? "",
    planId: organization.planId,
  });

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/organizations/${organization.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        toast.error(json?.error?.message ?? t("saveFailed"));
        return;
      }
      toast.success(tCommon("save"));
      router.refresh();
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl border border-white/10 bg-black/30 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["name", t("name")],
              ["slug", t("slug")],
              ["brandName", t("brandName")],
              ["logoUrl", t("logoUrl")],
              ["primaryColor", t("primaryColor")],
              ["secondaryColor", t("secondaryColor")],
              ["customDomain", t("customDomain")],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label>{label}</Label>
              <Input
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <Label>{t("mode")}</Label>
            <Select
              value={form.mode}
              onValueChange={(v) => setForm((f) => ({ ...f, mode: v as OrgMode }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="B2C">B2C</SelectItem>
                <SelectItem value="B2B">B2B</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("plan")}</Label>
            <Select
              value={form.planId}
              onValueChange={(v) => setForm((f) => ({ ...f, planId: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {organization.stripeCustomerId ? (
          <p className="text-xs text-muted-foreground">
            Stripe: {organization.stripeCustomerId}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="gold"
            disabled={saving}
            onClick={() =>
              void patch({
                ...form,
                brandName: form.brandName || null,
                logoUrl: form.logoUrl || null,
                primaryColor: form.primaryColor || null,
                secondaryColor: form.secondaryColor || null,
                customDomain: form.customDomain || null,
              })
            }
          >
            {tCommon("save")}
          </Button>
          {organization.deletedAt ? (
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => void patch({ restore: true })}
            >
              {t("restore")}
            </Button>
          ) : (
            <Button
              variant="destructive"
              disabled={saving}
              onClick={() => void patch({ softDelete: true })}
            >
              {t("softDelete")}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">{t("members")}</h3>
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">
                  {m.user.name ?? m.user.email}
                </p>
                <p className="text-xs text-muted-foreground">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={m.role}
                  onValueChange={(role) =>
                    void patch({ member: { memberId: m.id, role } })
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["OWNER", "ADMIN", "MANAGER", "EDITOR", "VIEWER"] as const).map(
                      (role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() =>
                    void patch({ member: { memberId: m.id, remove: true } })
                  }
                >
                  {t("remove")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
