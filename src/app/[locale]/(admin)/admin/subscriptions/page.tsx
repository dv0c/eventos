import { CreditCard } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/server/db";

export default async function AdminSubscriptionsPage() {
  const t = await getTranslations("admin");
  const count = await prisma.subscription.count();
  const subscriptions = await prisma.subscription.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      organization: { select: { name: true } },
      plan: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("subscriptions")}</h1>
      <p className="text-muted-foreground">{t("totalCount", { count })}</p>

      {subscriptions.length === 0 ? (
        <EmptyState icon={CreditCard} title={t("noSubscriptions")} description={t("noSubscriptionsDesc")} />
      ) : (
        <Card className="surface-elevated">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="p-4 font-medium">{t("organization")}</th>
                  <th className="p-4 font-medium">{t("plan")}</th>
                  <th className="p-4 font-medium">{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-border/40">
                    <td className="p-4 font-medium">{sub.organization.name}</td>
                    <td className="p-4 text-muted-foreground">{sub.plan.name}</td>
                    <td className="p-4">
                      <Badge variant="secondary">{sub.status}</Badge>
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
