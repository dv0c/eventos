import { getTranslations } from "next-intl/server";

import { AdminOrgEditor } from "@/components/admin/admin-org-editor";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-ui";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/server/auth/session";
import { adminService } from "@/server/services/admin.service";

export default async function AdminOrgDetailPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  await requireAdmin();
  const { organizationId } = await params;
  const t = await getTranslations("admin");
  const [organization, plans] = await Promise.all([
    adminService.getOrganization(organizationId),
    adminService.listPlans(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={organization.name}
        description={organization.slug}
        actions={
          <Link
            href="/admin/organizations"
            className="rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            {t("backToList")}
          </Link>
        }
      />

      <AdminOrgEditor
        organization={organization}
        plans={plans.map((p) => ({ id: p.id, name: p.name, slug: p.slug }))}
        members={organization.members}
      />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t("events")}</h2>
        <AdminTable>
          <thead>
            <tr className="border-b border-white/10 text-left text-muted-foreground">
              <th className="p-3 font-medium">{t("eventName")}</th>
              <th className="p-3 font-medium">{t("status")}</th>
              <th className="p-3 font-medium">{t("date")}</th>
            </tr>
          </thead>
          <tbody>
            {organization.events.map((event) => (
              <tr key={event.id} className="border-b border-white/5">
                <td className="p-3">
                  <Link href={`/admin/events/${event.id}`} className="hover:text-gold">
                    {event.name}
                  </Link>
                </td>
                <td className="p-3">{event.status}</td>
                <td className="p-3 text-muted-foreground">
                  {event.date.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      </div>
    </div>
  );
}
