"use client";

import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

interface OrgSwitcherProps {
  organizations: OrganizationSummary[];
  activeOrganizationId?: string | null;
  onOrganizationChange?: (organizationId: string) => void;
  onCreateOrganization?: () => void;
  className?: string;
}

export function OrgSwitcher({
  organizations,
  activeOrganizationId,
  onOrganizationChange,
  onCreateOrganization,
  className,
}: OrgSwitcherProps) {
  const t = useTranslations("nav");

  const activeOrg =
    organizations.find((org) => org.id === activeOrganizationId) ??
    organizations[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="glass"
          role="combobox"
          className={cn(
            "h-9 w-[200px] justify-between rounded-full px-2.5 font-normal sm:w-[240px]",
            className,
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/10">
              <Building2 className="h-3 w-3 text-gold" />
            </span>
            <span className="truncate text-sm">
              {activeOrg?.name ?? t("currentOrg")}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[240px] rounded-xl border-white/15 bg-black/85 text-foreground shadow-none backdrop-blur-xl"
        align="start"
      >
        <DropdownMenuLabel>{t("organizations")}</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            className="cursor-pointer rounded-lg focus:bg-white/10 focus:text-foreground"
            onClick={() => onOrganizationChange?.(org.id)}
          >
            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="flex-1 truncate">{org.name}</span>
            {activeOrg?.id === org.id ? (
              <Check className="ml-2 h-4 w-4 text-gold" />
            ) : null}
          </DropdownMenuItem>
        ))}
        {organizations.length === 0 ? (
          <DropdownMenuItem disabled className="text-muted-foreground">
            {t("currentOrg")}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          className="cursor-pointer rounded-lg text-gold focus:bg-white/10 focus:text-gold"
          onClick={onCreateOrganization}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("createOrg")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
