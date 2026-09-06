"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useOrgPath } from "@/components/providers/org-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

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
        <SelectTrigger className="w-[200px] rounded-full border-white/15 bg-black/40 backdrop-blur-md">
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

      <div className="flex flex-wrap gap-1.5 rounded-full border border-white/10 bg-black/35 p-1.5 backdrop-blur-md">
        {(["all", "active", "upcoming", "completed"] as const).map((tf) => {
          const active = (currentTimeframe ?? "all") === tf;
          return (
            <Link
              key={tf}
              href={
                tf === "all"
                  ? `${dashboardPath}${currentClientId ? `?clientId=${currentClientId}` : ""}`
                  : `${dashboardPath}?timeframe=${tf}${currentClientId ? `&clientId=${currentClientId}` : ""}`
              }
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border border-white/20 bg-black/45 text-foreground backdrop-blur-md"
                  : "border border-transparent text-muted-foreground hover:bg-white/10 hover:text-foreground",
              )}
            >
              {t(`timeframe.${tf}`)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
