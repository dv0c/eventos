import { AuditAction } from "@prisma/client";
import { getTranslations } from "next-intl/server";

import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import {
  AdminPageHeader,
  AdminPagination,
  AdminTable,
} from "@/components/admin/admin-ui";
import { requireAdmin } from "@/server/auth/session";
import { adminService } from "@/server/services/admin.service";

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const t = await getTranslations("admin");
  const sp = await searchParams;
  const search = typeof sp.q === "string" ? sp.q : undefined;
  const action =
    typeof sp.action === "string" &&
    Object.values(AuditAction).includes(sp.action as AuditAction)
      ? (sp.action as AuditAction)
      : undefined;
  const from = typeof sp.from === "string" ? new Date(sp.from) : undefined;
  const to = typeof sp.to === "string" ? new Date(sp.to) : undefined;
  const page = Number(sp.page ?? 1) || 1;

  const data = await adminService.listAuditLogs({
    search,
    action,
    from: from && !Number.isNaN(from.getTime()) ? from : undefined,
    to: to && !Number.isNaN(to.getTime()) ? to : undefined,
    page,
    pageSize: 40,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("auditLogs")}
        description={t("totalCount", { count: data.total })}
      />
      <AdminFilterBar
        basePath="/admin/audit-logs"
        initial={{ q: search }}
        extras={
          <>
            <select
              name="action"
              defaultValue={action ?? ""}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{t("allActions")}</option>
              {Object.values(AuditAction).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="from"
              defaultValue={
                typeof sp.from === "string" ? sp.from : undefined
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
            <input
              type="date"
              name="to"
              defaultValue={typeof sp.to === "string" ? sp.to : undefined}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </>
        }
      />
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
          {data.items.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-6 text-center text-muted-foreground">
                {t("noAuditLogs")}
              </td>
            </tr>
          ) : (
            data.items.map((log) => (
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
                  {log.entityId ? ` · ${log.entityId.slice(0, 10)}` : ""}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </AdminTable>
      <AdminPagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        hrefForPage={(p) => {
          const params = new URLSearchParams();
          if (search) params.set("q", search);
          if (action) params.set("action", action);
          if (typeof sp.from === "string") params.set("from", sp.from);
          if (typeof sp.to === "string") params.set("to", sp.to);
          params.set("page", String(p));
          return `/admin/audit-logs?${params}`;
        }}
      />
    </div>
  );
}
