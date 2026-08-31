"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orgPath } from "@/lib/org-path";
import { useRouter } from "@/i18n/navigation";

export function CreateOrganizationForm() {
  const t = useTranslations("setup");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();

    if (!name) {
      setIsLoading(false);
      return;
    }

    try {
      const createResponse = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        toast.error(createData.error?.message ?? tErrors("generic"));
        setIsLoading(false);
        return;
      }

      const organization = createData.data?.organization as
        | { id: string; slug: string }
        | undefined;

      if (organization?.id) {
        await fetch("/api/organizations/switch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId: organization.id }),
        });
      }

      if (organization?.slug) {
        router.push(orgPath(organization.slug, "/dashboard"));
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      toast.error(tErrors("networkError"));
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("orgName")}</Label>
        <Input
          id="name"
          name="name"
          required
          autoComplete="organization"
          placeholder={t("orgNamePlaceholder")}
          disabled={isLoading}
        />
      </div>
      <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
        {isLoading ? t("creating") : t("submit")}
      </Button>
    </form>
  );
}
