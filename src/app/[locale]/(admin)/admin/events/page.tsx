import { CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/server/db";

export default async function AdminEventsPage() {
  const t = await getTranslations("admin");
  const count = await prisma.event.count({ where: { deletedAt: null } });
  const events = await prisma.event.findMany({
    where: { deletedAt: null },
    take: 20,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, status: true, date: true, organization: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("events")}</h1>
      <p className="text-muted-foreground">{t("totalCount", { count })}</p>

      {events.length === 0 ? (
        <EmptyState icon={CalendarDays} title={t("noEvents")} description={t("noEventsDesc")} />
      ) : (
        <Card className="surface-elevated">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="p-4 font-medium">{t("eventName")}</th>
                  <th className="p-4 font-medium">{t("organization")}</th>
                  <th className="p-4 font-medium">{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-border/40">
                    <td className="p-4 font-medium">{event.name}</td>
                    <td className="p-4 text-muted-foreground">{event.organization.name}</td>
                    <td className="p-4">
                      <Badge variant="secondary">{event.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
