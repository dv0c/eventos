"use client";

import {
  Building2,
  CalendarDays,
  CreditCard,
  ImageIcon,
  LayoutDashboard,
  ScrollText,
  Shield,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  labelKey: string;
  icon: LucideIcon;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { path: "/admin", labelKey: "overview", icon: LayoutDashboard, exact: true },
  { path: "/admin/users", labelKey: "users", icon: Users },
  { path: "/admin/organizations", labelKey: "organizations", icon: Building2 },
  { path: "/admin/events", labelKey: "events", icon: CalendarDays },
  { path: "/admin/media", labelKey: "media", icon: ImageIcon },
  { path: "/admin/billing", labelKey: "billing", icon: CreditCard },
  { path: "/admin/audit-logs", labelKey: "auditLogs", icon: ScrollText },
];

interface AdminSidebarProps {
  className?: string;
  userEmail?: string | null;
  userName?: string | null;
  onNavigate?: () => void;
}

export function AdminSidebar({
  className,
  userEmail,
  userName,
  onNavigate,
}: AdminSidebarProps) {
  const t = useTranslations("admin");
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.path;
    return pathname === item.path || pathname.startsWith(`${item.path}/`);
  };

  const accountDisplayName = userName?.trim() || t("platformAdmin");
  const initials = (userName?.trim() || userEmail || "A")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={cn(
        "flex h-full w-56 shrink-0 flex-col border-r border-white/10 bg-sidebar/60 backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex h-14 items-center gap-2 px-4">
        <Logo variant="full" size="sm" theme="light" />
      </div>

      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-2 text-xs font-medium text-gold">
          <Shield className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{t("platformAdmin")}</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.path}
              href={item.path}
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
                  active
                    ? "text-gold"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-full border border-transparent px-1.5 py-1.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/45 text-[11px] font-semibold text-foreground backdrop-blur-md">
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
        </div>
      </div>
    </aside>
  );
}
