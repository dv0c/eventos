"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { orgPath } from "@/lib/org-path";
import { Link, useRouter } from "@/i18n/navigation";

interface AcceptInviteButtonProps {
  token: string;
}

export function AcceptInviteButton({ token }: AcceptInviteButtonProps) {
  const t = useTranslations("invite");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleAccept() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/organizations/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error?.message ?? tErrors("generic"));
        setIsLoading(false);
        return;
      }

      const slug = data.data?.organization?.slug as string | undefined;

      if (slug) {
        router.push(orgPath(slug, "/dashboard"));
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
    <Button variant="gold" disabled={isLoading} onClick={() => void handleAccept()}>
      {isLoading ? t("accepting") : t("accept")}
    </Button>
  );
}

interface InviteLoginPromptProps {
  token: string;
}

export function InviteLoginPrompt({ token }: InviteLoginPromptProps) {
  const t = useTranslations("invite");

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button variant="gold" asChild>
        <Link href={`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}>
          {t("signInToAccept")}
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href={`/register?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}>
          {t("createAccount")}
        </Link>
      </Button>
    </div>
  );
}
