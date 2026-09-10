import {
  Building2,
  CalendarDays,
  CreditCard,
  HardDrive,
  ImageIcon,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AdminAnalyticsCharts } from "@/components/admin/admin-analytics-charts";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/server/auth/session";
import { adminService } from "@/server/services/admin.service";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const t = await getTranslations("admin");
  const data = await adminService.getOverview();

  const stats = [
    {
      label: t("users"),
      value: data.summary.users,
      href: "/admin/users",
      icon: Users,
    },
    {
      label: t("organizations"),
      value: data.summary.organizations,
      href: "/admin/organizations",
      icon: Building2,
    },
    {
      label: t("events"),
      value: data.summary.events,
      href: "/admin/events",
      icon: CalendarDays,
    },
    {
      label: t("mediaPending"),
      value: data.summary.mediaPending,
      href: "/admin/media?status=PENDING",
      icon: ImageIcon,
    },
    {
      label: t("subscriptions"),
      value: data.summary.subscriptionsActive,
      href: "/admin/billing?tab=subscriptions",
      icon: CreditCard,
    },
    {
      label: t("storage"),
      value: formatBytes(data.summary.storageBytes),
      href: "/admin/media",
      icon: HardDrive,
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader title={t("title")} description={t("overviewDesc")} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, href, icon: Icon }) => (
          <Link key={href + label} href={href}>
            <Card className="surface-elevated transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15">
                  <Icon className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <AdminAnalyticsCharts
        signups={data.charts.signups}
        eventsCreated={data.charts.eventsCreated}
        mediaUploads={data.charts.mediaUploads}
        subscriptionsByStatus={data.charts.subscriptionsByStatus}
        labels={{
          signups: t("chartSignups"),
          events: t("chartEvents"),
          media: t("chartMedia"),
          subscriptions: t("chartSubscriptions"),
        }}
      />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t("recentActivity")}</h2>
        <AdminTable>
          <thead>
            <tr className="border-b border-white/10 text-left text-muted-foreground">
              <th className="p-3 font-medium">{t("date")}</th>
              <th className="p-3 font-medium">{t("user")}</th>
              <th className="p-3 font-medium">{t("action")}</th>
              <th className="p-3 font-medium">{t("entity")}</th>
            </tr>
          </thead>
          <tbody>
            {data.recentAudit.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  {t("noAuditLogs")}
                </td>
              </tr>
            ) : (
              data.recentAudit.map((log) => (
                <tr key={log.id} className="border-b border-white/5">
                  <td className="p-3 text-muted-foreground">
                    {log.createdAt.toLocaleString()}
                  </td>
                  <td className="p-3">
                    {log.user?.email ?? log.user?.name ?? "—"}
                  </td>
                  <td className="p-3">{log.action}</td>
                  <td className="p-3 text-muted-foreground">
                    {log.entity}
                    {log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </AdminTable>
      </div>
    </div>
  );
}
