"use client";

import { Check, ListFilter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useOrgPath } from "@/components/providers/org-provider";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TIMEFRAMES = ["all", "active", "upcoming", "completed"] as const;

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
  const orgPath = useOrgPath();
  const dashboardPath = orgPath("/dashboard");
  const [open, setOpen] = useState(false);

  const timeframe = currentTimeframe ?? "all";
  const clientLabel = currentClientId
    ? (clients.find((c) => c.id === currentClientId)?.name ?? t("allClients"))
    : t("allClients");
  const timeframeLabel = t(`timeframe.${timeframe}` as "timeframe.all");
  const summaryLabel = `${clientLabel} · ${timeframeLabel}`;

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    router.push(query ? `${dashboardPath}?${query}` : dashboardPath);
  };

  const applyAndClose = (key: string, value: string | null) => {
    updateParam(key, value);
    setOpen(false);
  };

  const timeframeHref = (tf: (typeof TIMEFRAMES)[number]) => {
    const params = new URLSearchParams();
    if (tf !== "all") params.set("timeframe", tf);
    if (currentClientId) params.set("clientId", currentClientId);
    const query = params.toString();
    return query ? `${dashboardPath}?${query}` : dashboardPath;
  };

  return (
    <>
      {/* Mobile: single Filters control → bottom Drawer */}
      <div className="md:hidden">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="glass"
              className="h-10 w-full justify-start gap-2 px-4 text-left font-medium"
              aria-label={t("filters")}
            >
              <ListFilter className="h-4 w-4 shrink-0 opacity-80" />
              <span className="min-w-0 flex-1 truncate">{summaryLabel}</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t("filtersTitle")}</DrawerTitle>
            </DrawerHeader>
            <div className="space-y-6 overflow-y-auto px-4 pb-8">
              <section className="space-y-2">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("filterClient")}
                </h3>
                <ul className="space-y-1">
                  <li>
                    <FilterOption
                      label={t("allClients")}
                      selected={!currentClientId}
                      onSelect={() => applyAndClose("clientId", null)}
                    />
                  </li>
                  {clients.map((client) => (
                    <li key={client.id}>
                      <FilterOption
                        label={client.name}
                        selected={currentClientId === client.id}
                        onSelect={() => applyAndClose("clientId", client.id)}
                      />
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("filterTimeframe")}
                </h3>
                <ul className="space-y-1">
                  {TIMEFRAMES.map((tf) => (
                    <li key={tf}>
                      <FilterOption
                        label={t(`timeframe.${tf}`)}
                        selected={timeframe === tf}
                        onSelect={() =>
                          applyAndClose("timeframe", tf === "all" ? null : tf)
                        }
                      />
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop: Select + single-row chips */}
      <div className="hidden items-center gap-3 md:flex">
        <Select
          value={currentClientId ?? "all"}
          onValueChange={(v) => updateParam("clientId", v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[200px] shrink-0 rounded-full border-white/15 bg-black/40 backdrop-blur-md">
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

        <div className="flex min-w-0 flex-nowrap gap-1.5 overflow-x-auto rounded-full border border-white/10 bg-black/35 p-1.5 backdrop-blur-md">
          {TIMEFRAMES.map((tf) => {
            const active = timeframe === tf;
            return (
              <Link
                key={tf}
                href={timeframeHref(tf)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
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
    </>
  );
}

function FilterOption({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors",
        selected
          ? "bg-white/10 font-medium text-foreground"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
      )}
    >
      <span className="min-w-0 truncate">{label}</span>
      {selected ? <Check className="h-4 w-4 shrink-0 text-gold" aria-hidden /> : null}
    </button>
  );
}
