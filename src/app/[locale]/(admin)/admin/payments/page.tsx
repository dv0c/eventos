import { CreditCard } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/server/db";

export default async function AdminPaymentsPage() {
  const t = await getTranslations("admin");
  const count = await prisma.invoice.count();
  const invoices = await prisma.invoice.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      subscription: {
        include: {
          organization: { select: { name: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("payments")}</h1>
      <p className="text-muted-foreground">{t("totalCount", { count })}</p>

      {invoices.length === 0 ? (
        <EmptyState icon={CreditCard} title={t("noPayments")} description={t("noPaymentsDesc")} />
      ) : (
        <Card className="surface-elevated">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="p-4 font-medium">{t("organization")}</th>
                  <th className="p-4 font-medium">{t("amount")}</th>
                  <th className="p-4 font-medium">{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border/40">
                    <td className="p-4 font-medium">{invoice.subscription.organization.name}</td>
                    <td className="p-4 text-muted-foreground">
                      {invoice.amount} {invoice.currency}
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{invoice.status}</Badge>
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
