"use client";

import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Settings,
  Shield,
  UsersRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";

import { useOrg, useOrgPath } from "@/components/providers/org-provider";
import { Logo } from "@/components/shared/logo";
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

const workspaceNav: NavItem[] = [
  { path: "/dashboard", labelKey: "overview", icon: LayoutDashboard },
  { path: "/events", labelKey: "events", icon: CalendarDays },
];

const organizationNav: NavItem[] = [
  { path: "/team", labelKey: "team", icon: UsersRound },
  { path: "/settings", labelKey: "settings", icon: Settings },
  { path: "/billing", labelKey: "billing", icon: CreditCard, billingOnly: true },
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
  const orgPath = useOrgPath();
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
    if (item.adminOnly && !isAdmin) return null;
    if (item.billingOnly && !canManageBilling) return null;

    const Icon = item.icon;
    const active = isActive(item);
    const href = resolveHref(item);

    return (
      <Link
        key={item.path}
        href={href}
        onClick={onNavigate}
        className={cn(
          "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
          active
            ? "bg-white/10 text-foreground"
            : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-foreground",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
          )}
        />
        {t(item.labelKey)}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "flex h-full w-56 shrink-0 flex-col border-r border-white/10 bg-sidebar",
        className,
      )}
    >
      <div className="flex h-14 flex-col justify-center gap-0.5 border-b border-white/10 px-4">
        {mode === "B2B" && logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={brandDisplayName} className="h-6 max-w-[140px] object-contain" />
        ) : (
          <Logo variant="full" size="sm" theme="light" />
        )}
        {brandDisplayName ? (
          <p className="truncate text-[11px] text-muted-foreground">{brandDisplayName}</p>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 py-3">
        <div className="space-y-0.5">
          <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            {t("sectionWorkspace")}
          </p>
          {workspaceNav.map(renderNavItem)}
        </div>

        <div className="space-y-0.5">
          <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            {t("sectionOrganization")}
          </p>
          {organizationNav.map(renderNavItem)}
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          href={orgPath("/settings")}
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-white/5"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[11px] font-semibold text-foreground">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-foreground">
              {accountDisplayName}
            </p>
            {userEmail ? (
              <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
            ) : null}
          </div>
        </Link>
      </div>
    </aside>
  );
}
