"use client";

import {
  BarChart3,
  CalendarDays,
  CreditCard,
  FileStack,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
  UsersRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";

import { useOrgPath } from "@/components/providers/org-provider";
import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  labelKey: string;
  icon: LucideIcon;
  badge?: string;
  adminOnly?: boolean;
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
  { path: "/billing", labelKey: "billing", icon: CreditCard },
  { path: "/settings", labelKey: "settings", icon: Settings },
  { path: "/admin", labelKey: "admin", icon: Shield, adminOnly: true, orgScoped: false },
];

interface AppSidebarProps {
  className?: string;
  isAdmin?: boolean;
}

export function AppSidebar({ className, isAdmin = false }: AppSidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const orgPath = useOrgPath;

  const resolveHref = (item: NavItem) =>
    item.orgScoped === false ? item.path : orgPath(item.path);

  const isActive = (item: NavItem) => {
    const href = resolveHref(item);

    if (item.path === "/dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderNavItem = (item: NavItem) => {
    if (item.adminOnly && !isAdmin) {
      return null;
    }

    const Icon = item.icon;
    const active = isActive(item);
    const href = resolveHref(item);

    return (
      <Link
        key={item.path}
        href={href}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            active ? "text-primary" : "text-muted-foreground group-hover:text-primary",
          )}
        />
        <span className="flex-1">{t(item.labelKey)}</span>
        {item.badge ? (
          <Badge variant="gold" className="h-5 px-1.5 text-[10px]">
            {item.badge}
          </Badge>
        ) : null}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar",
        className,
      )}
    >
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Logo variant="full" size="md" />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Menu
        </p>
        {mainNavItems.map(renderNavItem)}

        <Separator className="my-3" />

        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Organization
        </p>
        {secondaryNavItems.map(renderNavItem)}
      </nav>
    </aside>
  );
}
