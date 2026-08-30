import { Building2, CalendarDays, CreditCard, FileText, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/server/db";

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin");

  const [users, events, organizations, subscriptions] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.event.count({ where: { deletedAt: null } }),
    prisma.organization.count({ where: { deletedAt: null } }),
    prisma.subscription.count(),
  ]);

  const stats = [
    { label: t("users"), value: users, href: "/admin/users", icon: Users },
    { label: t("events"), value: events, href: "/admin/events", icon: CalendarDays },
    { label: t("organizations"), value: organizations, href: "/admin/organizations", icon: Building2 },
    { label: t("subscriptions"), value: subscriptions, href: "/admin/subscriptions", icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, href, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="surface-elevated transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
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
      <Card className="surface-elevated">
        <CardContent className="flex items-center gap-4 p-4">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("overviewDesc")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
