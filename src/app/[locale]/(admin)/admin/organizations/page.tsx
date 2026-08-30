import { Building2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/server/db";

export default async function AdminOrganizationsPage() {
  const t = await getTranslations("admin");
  const count = await prisma.organization.count({ where: { deletedAt: null } });
  const organizations = await prisma.organization.findMany({
    where: { deletedAt: null },
    take: 20,
    orderBy: { createdAt: "desc" },
    include: { plan: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("organizations")}</h1>
      <p className="text-muted-foreground">{t("totalCount", { count })}</p>

      {organizations.length === 0 ? (
        <EmptyState icon={Building2} title={t("noOrganizations")} description={t("noOrganizationsDesc")} />
      ) : (
        <Card className="surface-elevated">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="p-4 font-medium">{t("name")}</th>
                  <th className="p-4 font-medium">{t("plan")}</th>
                  <th className="p-4 font-medium">{t("slug")}</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id} className="border-b border-border/40">
                    <td className="p-4 font-medium">{org.name}</td>
                    <td className="p-4 text-muted-foreground">{org.plan.name}</td>
                    <td className="p-4 text-muted-foreground">{org.slug}</td>
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
