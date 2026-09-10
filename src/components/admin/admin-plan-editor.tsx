"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type PlanRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  isActive: boolean;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  sortOrder: number;
  limits: unknown;
  features: unknown;
};

export function AdminPlanEditor({ plan }: { plan: PlanRow }) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: plan.name,
    description: plan.description ?? "",
    priceMonthly: String(plan.priceMonthly),
    priceYearly: String(plan.priceYearly),
    isActive: plan.isActive,
    stripePriceIdMonthly: plan.stripePriceIdMonthly ?? "",
    stripePriceIdYearly: plan.stripePriceIdYearly ?? "",
    sortOrder: String(plan.sortOrder),
    limits: JSON.stringify(plan.limits ?? {}, null, 2),
    features: JSON.stringify(plan.features ?? [], null, 2),
  });

  async function save() {
    setSaving(true);
    try {
      let limits: unknown;
      let features: unknown;
      try {
        limits = JSON.parse(form.limits);
        features = JSON.parse(form.features);
      } catch {
        toast.error(t("invalidJson"));
        setSaving(false);
        return;
      }
      const res = await fetch("/api/admin/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "plan",
          id: plan.id,
          name: form.name,
          description: form.description || null,
          priceMonthly: Number(form.priceMonthly),
          priceYearly: Number(form.priceYearly),
          isActive: form.isActive,
          stripePriceIdMonthly: form.stripePriceIdMonthly || null,
          stripePriceIdYearly: form.stripePriceIdYearly || null,
          sortOrder: Number(form.sortOrder),
          limits,
          features,
        }),
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
    <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{plan.slug}</h3>
        <label className="flex items-center gap-2 text-sm">
          <span>{t("active")}</span>
          <Switch
            checked={form.isActive}
            onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["name", t("name")],
            ["description", t("description")],
            ["priceMonthly", t("priceMonthly")],
            ["priceYearly", t("priceYearly")],
            ["stripePriceIdMonthly", "Stripe monthly"],
            ["stripePriceIdYearly", "Stripe yearly"],
            ["sortOrder", t("sortOrder")],
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
      </div>
      <div className="space-y-1.5">
        <Label>limits JSON</Label>
        <textarea
          className="min-h-24 w-full rounded-md border border-input bg-background p-2 font-mono text-xs"
          value={form.limits}
          onChange={(e) => setForm((f) => ({ ...f, limits: e.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label>features JSON</Label>
        <textarea
          className="min-h-20 w-full rounded-md border border-input bg-background p-2 font-mono text-xs"
          value={form.features}
          onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
        />
      </div>
      <Button variant="gold" disabled={saving} onClick={() => void save()}>
        {tCommon("save")}
      </Button>
    </div>
  );
}
