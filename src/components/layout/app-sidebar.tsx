"use client";

import {
  BarChart3,
  CalendarDays,
  CreditCard,
  FileStack,
  LayoutDashboard,
  Mail,
  Settings,
  Shield,
  Sparkles,
  Users,
  UsersRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  badge?: string;
  adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/events", labelKey: "events", icon: CalendarDays },
  { href: "/clients", labelKey: "clients", icon: Users },
  { href: "/templates", labelKey: "templates", icon: FileStack },
  { href: "/invitations", labelKey: "invitations", icon: Mail },
  { href: "/analytics", labelKey: "analytics", icon: BarChart3 },
];

const secondaryNavItems: NavItem[] = [
  { href: "/team", labelKey: "team", icon: UsersRound },
  { href: "/billing", labelKey: "billing", icon: CreditCard },
  { href: "/settings", labelKey: "settings", icon: Settings },
  { href: "/admin", labelKey: "admin", icon: Shield, adminOnly: true },
];

interface AppSidebarProps {
  className?: string;
  isAdmin?: boolean;
}

export function AppSidebar({ className, isAdmin = false }: AppSidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderNavItem = (item: NavItem) => {
    if (item.adminOnly && !isAdmin) {
      return null;
    }

    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
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
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
          <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
        </span>
        <span className="font-semibold tracking-tight">Eventos</span>
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
