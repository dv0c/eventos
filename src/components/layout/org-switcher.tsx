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
  slug?: string;
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
          variant="outline"
          role="combobox"
          className={cn(
            "h-10 w-[220px] justify-between border-border/60 bg-background/50 font-normal sm:w-[260px]",
            className,
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Building2 className="h-3.5 w-3.5 text-primary" />
            </span>
            <span className="truncate">
              {activeOrg?.name ?? t("currentOrg")}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[260px]" align="start">
        <DropdownMenuLabel>{t("organizations")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            className="cursor-pointer"
            onClick={() => onOrganizationChange?.(org.id)}
          >
            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="flex-1 truncate">{org.name}</span>
            {activeOrg?.id === org.id ? (
              <Check className="ml-2 h-4 w-4 text-primary" />
            ) : null}
          </DropdownMenuItem>
        ))}
        {organizations.length === 0 ? (
          <DropdownMenuItem disabled className="text-muted-foreground">
            {t("currentOrg")}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-primary"
          onClick={onCreateOrganization}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("createOrg")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
