"use client";

import type { OrganizationSummary } from "@/components/layout/org-switcher";
import { OrgSwitcher } from "@/components/layout/org-switcher";
import { useOrgPath } from "@/components/providers/org-provider";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LogOut, Settings } from "lucide-react";
import { useTranslations } from "next-intl";

interface AppHeaderProps {
  className?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  organizations?: OrganizationSummary[];
  activeOrganizationId?: string | null;
  onOrganizationChange?: (organizationId: string) => void;
  onCreateOrganization?: () => void;
  onSignOut?: () => void;
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return email?.[0]?.toUpperCase() ?? "U";
}

export function AppHeader({
  className,
  user,
  organizations = [],
  activeOrganizationId,
  onOrganizationChange,
  onCreateOrganization,
  onSignOut,
}: AppHeaderProps) {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const orgPath = useOrgPath;

  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:px-6",
        className,
      )}
    >
      <OrgSwitcher
        organizations={organizations}
        activeOrganizationId={activeOrganizationId}
        onOrganizationChange={onOrganizationChange}
        onCreateOrganization={onCreateOrganization}
      />

      <div className="flex items-center gap-2">
        <LocaleSwitcher variant="outline" size="sm" />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ""} />
                <AvatarFallback>
                  {getInitials(user?.name, user?.email)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.name ?? t("profile")}
                </p>
                {user?.email ? (
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                ) : null}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={orgPath("/settings")} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                {tNav("settings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={onSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
