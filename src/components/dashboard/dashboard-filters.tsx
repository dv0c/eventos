"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useOrgPath } from "@/components/providers/org-provider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@/i18n/navigation";

interface DashboardFiltersProps {
  clients: Array<{ id: string; name: string }>;
  currentClientId?: string;
  currentTimeframe?: string;
}

export function DashboardFilters({
  clients,
  currentClientId,
  currentTimeframe,
}: DashboardFiltersProps) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgPath = useOrgPath;
  const dashboardPath = orgPath("/dashboard");

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${dashboardPath}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={currentClientId ?? "all"}
        onValueChange={(v) => updateParam("clientId", v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t("filterClient")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allClients")}</SelectItem>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-1 rounded-lg border border-border/60 p-1">
        {(["all", "active", "upcoming", "completed"] as const).map((tf) => (
          <Button
            key={tf}
            variant={(currentTimeframe ?? "all") === tf ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link
              href={
                tf === "all"
                  ? `${dashboardPath}${currentClientId ? `?clientId=${currentClientId}` : ""}`
                  : `${dashboardPath}?timeframe=${tf}${currentClientId ? `&clientId=${currentClientId}` : ""}`
              }
            >
              {t(`timeframe.${tf}`)}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
