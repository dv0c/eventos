"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuditAction } from "@prisma/client";

const AUDIT_ACTIONS = Object.values(AuditAction);

interface AuditLogFiltersProps {
  currentAction?: string;
  currentSearch?: string;
}

export function AuditLogFilters({ currentAction, currentSearch }: AuditLogFiltersProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const searchParams = useSearchParams();

  const applyFilters = (action?: string, search?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (action && action !== "all") params.set("action", action);
    else params.delete("action");
    if (search) params.set("search", search);
    else params.delete("search");
    router.push(`/admin/audit-logs?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={currentAction ?? "all"}
        onValueChange={(v) => applyFilters(v, currentSearch)}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder={t("filterAction")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allActions")}</SelectItem>
          {AUDIT_ACTIONS.map((action) => (
            <SelectItem key={action} value={action}>
              {action}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const search = (form.elements.namedItem("search") as HTMLInputElement).value;
          applyFilters(currentAction, search);
        }}
      >
        <Input
          name="search"
          defaultValue={currentSearch}
          placeholder={t("searchUser")}
          className="w-[200px]"
        />
        <Button type="submit" variant="outline" size="sm">
          {t("filter")}
        </Button>
      </form>
    </div>
  );
}
