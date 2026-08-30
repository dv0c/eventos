import { Suspense } from "react";
import { ScrollText } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { AuditAction, Prisma } from "@prisma/client";

import { AuditLogFilters } from "@/components/admin/audit-log-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { prisma } from "@/server/db";

export default async function AdminAuditLogsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ action?: string; search?: string }>;
}) {
  const { locale } = await params;
  const { action, search } = await searchParams;
  const t = await getTranslations("admin");

  const where: Prisma.AuditLogWhereInput = {
    ...(action && action !== "all" ? { action: action as AuditAction } : {}),
    ...(search
      ? {
          OR: [
            { user: { email: { contains: search, mode: "insensitive" } } },
            { user: { name: { contains: search, mode: "insensitive" } } },
            { entity: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const count = await prisma.auditLog.count({ where });
  const logs = await prisma.auditLog.findMany({
    where,
    take: 50,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("auditLogs")}</h1>
      <p className="text-muted-foreground">{t("totalCount", { count })}</p>

      <Suspense fallback={null}>
        <AuditLogFilters currentAction={action} currentSearch={search} />
      </Suspense>

      {logs.length === 0 ? (
        <EmptyState icon={ScrollText} title={t("noAuditLogs")} description={t("noAuditLogsDesc")} />
      ) : (
        <Card className="surface-elevated">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="p-4 font-medium">{t("action")}</th>
                  <th className="p-4 font-medium">{t("user")}</th>
                  <th className="p-4 font-medium">{t("entity")}</th>
                  <th className="p-4 font-medium">{t("date")}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/40">
                    <td className="p-4 font-medium">{log.action}</td>
                    <td className="p-4 text-muted-foreground">
                      {log.user?.name ?? log.user?.email ?? "—"}
                    </td>
                    <td className="p-4 text-muted-foreground">{log.entity}</td>
                    <td className="p-4 text-muted-foreground">
                      {formatDate(log.createdAt, locale as "el" | "en")}
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
