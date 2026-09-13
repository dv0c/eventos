import { getTranslations } from "next-intl/server";

import { AdminUserEditor } from "@/components/admin/admin-user-editor";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-ui";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/server/auth/session";
import { adminService } from "@/server/services/admin.service";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdmin();
  const { userId } = await params;
  const t = await getTranslations("admin");
  const { user, recentAudit } = await adminService.getUser(userId);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={user.name ?? user.email}
        description={user.email}
        actions={
          <Link
            href="/admin/users"
            className="rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            {t("backToList")}
          </Link>
        }
      />

      <AdminUserEditor user={user} />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t("memberships")}</h2>
        <AdminTable>
          <thead>
            <tr className="border-b border-white/10 text-left text-muted-foreground">
              <th className="p-3 font-medium">{t("organization")}</th>
              <th className="p-3 font-medium">{t("role")}</th>
            </tr>
          </thead>
          <tbody>
            {user.organizationMembers.map((m) => (
              <tr key={m.id} className="border-b border-white/5">
                <td className="p-3">
                  <Link
                    href={`/admin/organizations/${m.organization.id}`}
                    className="hover:text-gold"
                  >
                    {m.organization.name}
                  </Link>
                </td>
                <td className="p-3">{m.role}</td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t("recentActivity")}</h2>
        <AdminTable>
          <thead>
            <tr className="border-b border-white/10 text-left text-muted-foreground">
              <th className="p-3 font-medium">{t("date")}</th>
              <th className="p-3 font-medium">{t("action")}</th>
              <th className="p-3 font-medium">{t("entity")}</th>
            </tr>
          </thead>
          <tbody>
            {recentAudit.map((log) => (
              <tr key={log.id} className="border-b border-white/5">
                <td className="p-3 text-muted-foreground">
                  {log.createdAt.toLocaleString()}
                </td>
                <td className="p-3">{log.action}</td>
                <td className="p-3 text-muted-foreground">{log.entity}</td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      </div>
    </div>
  );
}
