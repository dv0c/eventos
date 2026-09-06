"use client";

import {
  BarChart3,
  CalendarDays,
  CreditCard,
  FileStack,
  LayoutDashboard,
  Settings,
  Shield,
  Star,
  Users,
  UsersRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";

import { useOrg, useOrgPath } from "@/components/providers/org-provider";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { can } from "@/server/permissions/matrix";

interface NavItem {
  path: string;
  labelKey: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  billingOnly?: boolean;
  orgScoped?: boolean;
}

const mainNavItems: NavItem[] = [
  { path: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { path: "/events", labelKey: "events", icon: CalendarDays },
  { path: "/clients", labelKey: "clients", icon: Users },
  { path: "/templates", labelKey: "templates", icon: FileStack },
  { path: "/analytics", labelKey: "analytics", icon: BarChart3 },
];

const secondaryNavItems: NavItem[] = [
  { path: "/team", labelKey: "team", icon: UsersRound },
  { path: "/billing", labelKey: "billing", icon: CreditCard, billingOnly: true },
  { path: "/settings", labelKey: "settings", icon: Settings },
  { path: "/admin", labelKey: "admin", icon: Shield, adminOnly: true, orgScoped: false },
];

interface AppSidebarProps {
  className?: string;
  isAdmin?: boolean;
  userEmail?: string | null;
  userName?: string | null;
  onNavigate?: () => void;
}

export function AppSidebar({
  className,
  isAdmin = false,
  userEmail,
  userName,
  onNavigate,
}: AppSidebarProps) {
  const t = useTranslations("nav");
  const tWorkspace = useTranslations("eventWorkspace");
  const pathname = usePathname();
  const orgPath = useOrgPath;
  const { orgRole, mode, logoUrl, displayName: brandDisplayName } = useOrg();
  const canManageBilling = can(orgRole, "org:manage_billing");

  const resolveHref = (item: NavItem) =>
    item.orgScoped === false ? item.path : orgPath(item.path);

  const isActive = (item: NavItem) => {
    const href = resolveHref(item);

    if (item.path === "/dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const accountDisplayName = userName?.trim() || tWorkspace("myAccount");
  const initials = (userName?.trim() || userEmail || "U")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const renderNavItem = (item: NavItem) => {
    if (item.adminOnly && !isAdmin) {
      return null;
    }

    if (item.billingOnly && !canManageBilling) {
      return null;
    }

    const Icon = item.icon;
    const active = isActive(item);
    const href = resolveHref(item);

    return (
      <Link
        key={item.path}
        href={href}
        onClick={onNavigate}
        className={cn(
          "group relative flex items-center gap-2.5 rounded-full px-2.5 py-2 text-[13px] font-medium transition-all",
          active
            ? "border border-white/20 bg-black/45 text-foreground backdrop-blur-md"
            : "border border-transparent text-sidebar-foreground/70 hover:border-white/10 hover:bg-white/5 hover:text-foreground",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            active ? "text-gold" : "text-muted-foreground group-hover:text-foreground",
          )}
        />
        {t(item.labelKey)}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "flex h-full w-56 shrink-0 flex-col border-r border-white/10 bg-sidebar/60 backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex h-14 items-center gap-2 px-4">
        {mode === "B2B" && logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={brandDisplayName} className="h-7 max-w-[140px] object-contain" />
        ) : (
          <Logo variant="full" size="sm" theme="light" />
        )}
        {mode === "B2B" && brandDisplayName ? (
          <span className="truncate text-sm font-semibold text-foreground md:hidden">
            {brandDisplayName}
          </span>
        ) : null}
      </div>

      {canManageBilling ? (
        <div className="space-y-2 px-3 pb-3">
          <Button variant="gold" size="sm" className="h-9 w-full gap-2 rounded-full" asChild>
            <Link href={orgPath("/billing")} onClick={onNavigate}>
              <Star className="h-3.5 w-3.5" />
              {tWorkspace("upgradeEvent")}
            </Link>
          </Button>
        </div>
      ) : null}

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2">
        {mainNavItems.map(renderNavItem)}

        <div className="my-2 border-t border-white/10" />

        {secondaryNavItems.map(renderNavItem)}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          href={orgPath("/settings")}
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-full border border-transparent px-1.5 py-1.5 transition-colors hover:border-white/10 hover:bg-white/5"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/45 text-[11px] font-semibold text-foreground backdrop-blur-md">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-foreground">{accountDisplayName}</p>
            {userEmail ? (
              <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
            ) : null}
          </div>
        </Link>
      </div>
    </aside>
  );
}
