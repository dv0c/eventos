import { getTranslations } from "next-intl/server";

import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import {
  AdminPageHeader,
  AdminPagination,
  AdminTable,
} from "@/components/admin/admin-ui";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/server/auth/session";
import { adminService } from "@/server/services/admin.service";

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const t = await getTranslations("admin");
  const sp = await searchParams;
  const search = typeof sp.q === "string" ? sp.q : undefined;
  const includeDeleted = sp.deleted === "1";
  const page = Number(sp.page ?? 1) || 1;

  const data = await adminService.listOrganizations({
    search,
    includeDeleted,
    page,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("organizations")}
        description={t("totalCount", { count: data.total })}
      />
      <AdminFilterBar
        basePath="/admin/organizations"
        initial={{ q: search, deleted: includeDeleted }}
        extras={
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" name="deleted" value="1" defaultChecked={includeDeleted} />
            {t("includeDeleted")}
          </label>
        }
      />
      <AdminTable>
        <thead>
          <tr className="border-b border-white/10 text-left text-muted-foreground">
            <th className="p-3 font-medium">{t("name")}</th>
            <th className="p-3 font-medium">{t("slug")}</th>
            <th className="p-3 font-medium">{t("mode")}</th>
            <th className="p-3 font-medium">{t("plan")}</th>
            <th className="p-3 font-medium">{t("members")}</th>
            <th className="p-3 font-medium">{t("events")}</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((org) => (
            <tr key={org.id} className="border-b border-white/5 hover:bg-white/5">
              <td className="p-3">
                <Link
                  href={`/admin/organizations/${org.id}`}
                  className="font-medium hover:text-gold"
                >
                  {org.name}
                </Link>
              </td>
              <td className="p-3 text-muted-foreground">{org.slug}</td>
              <td className="p-3">{org.mode}</td>
              <td className="p-3">{org.plan.name}</td>
              <td className="p-3">{org._count.members}</td>
              <td className="p-3">{org._count.events}</td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
      <AdminPagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        hrefForPage={(p) => {
          const params = new URLSearchParams();
          if (search) params.set("q", search);
          if (includeDeleted) params.set("deleted", "1");
          params.set("page", String(p));
          return `/admin/organizations?${params}`;
        }}
      />
    </div>
  );
}
