"use client";

import type { OrganizationSummary } from "@/components/layout/org-switcher";
import { OrgSwitcher } from "@/components/layout/org-switcher";
import { useOptionalOrg } from "@/components/providers/org-provider";
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
import { orgPath } from "@/lib/org-path";
import { cn } from "@/lib/utils";
import { LogOut, Menu, Settings } from "lucide-react";
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
  onOpenMobileNav?: () => void;
  /** Slimmer header for event workspace (still shows hamburger on mobile). */
  compact?: boolean;
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
  onOpenMobileNav,
  compact = false,
}: AppHeaderProps) {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const org = useOptionalOrg();
  const settingsHref = org ? orgPath(org.orgSlug, "/settings") : "/admin/settings";

  return (
    <header
      className={cn(
        "flex h-14 items-center justify-between gap-2 border-b border-white/10 bg-black/35 px-4 backdrop-blur-xl sm:px-6",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {onOpenMobileNav ? (
          <Button
            type="button"
            variant="glass"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full md:hidden"
            onClick={onOpenMobileNav}
            aria-label={tNav("menu")}
          >
            <Menu className="h-4 w-4" />
          </Button>
        ) : null}

        {!compact ? (
          <OrgSwitcher
            className="min-w-0 max-w-[min(200px,45vw)] sm:max-w-[240px]"
            organizations={organizations}
            activeOrganizationId={activeOrganizationId}
            onOrganizationChange={onOrganizationChange}
            onCreateOrganization={onCreateOrganization}
          />
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <LocaleSwitcher variant="glass" size="sm" />

        <Separator orientation="vertical" className="mx-1 hidden h-6 bg-white/15 sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="glass" size="icon" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ""} />
                <AvatarFallback className="bg-transparent text-[10px]">
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
              <Link href={settingsHref} className="cursor-pointer">
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
