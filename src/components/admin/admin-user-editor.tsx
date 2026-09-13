"use client";

import { Locale, PlatformRole } from "@prisma/client";
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

export function AdminUserEditor({
  user,
}: {
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    locale: Locale;
    platformRole: PlatformRole;
    deletedAt: Date | null;
  };
}) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [locale, setLocale] = useState(user.locale);
  const [platformRole, setPlatformRole] = useState(user.platformRole);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
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
    <div className="space-y-4 rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t("name")}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("email")}</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("phone")}</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("locale")}</Label>
          <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="el">el</SelectItem>
              <SelectItem value="en">en</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("role")}</Label>
          <Select
            value={platformRole}
            onValueChange={(v) => setPlatformRole(v as PlatformRole)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">USER</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="gold"
          disabled={saving}
          onClick={() =>
            void patch({
              name: name || null,
              email,
              phone: phone || null,
              locale,
              platformRole,
            })
          }
        >
          {tCommon("save")}
        </Button>
        {user.deletedAt ? (
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
  );
}
