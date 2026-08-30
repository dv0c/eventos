import { Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/server/db";

export default async function AdminUsersPage() {
  const t = await getTranslations("admin");
  const count = await prisma.user.count({ where: { deletedAt: null } });
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    take: 20,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, platformRole: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("users")}</h1>
      <p className="text-muted-foreground">{t("totalCount", { count })}</p>

      {users.length === 0 ? (
        <EmptyState icon={Users} title={t("noUsers")} description={t("noUsersDesc")} />
      ) : (
        <Card className="surface-elevated">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="p-4 font-medium">{t("name")}</th>
                  <th className="p-4 font-medium">{t("email")}</th>
                  <th className="p-4 font-medium">{t("role")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border/40">
                    <td className="p-4">{user.name ?? "—"}</td>
                    <td className="p-4 text-muted-foreground">{user.email}</td>
                    <td className="p-4">{user.platformRole}</td>
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
