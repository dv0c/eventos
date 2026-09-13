import { PlatformRole } from "@prisma/client";
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

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const t = await getTranslations("admin");
  const sp = await searchParams;
  const search = typeof sp.q === "string" ? sp.q : undefined;
  const role =
    sp.role === "ADMIN" || sp.role === "USER"
      ? (sp.role as PlatformRole)
      : undefined;
  const includeDeleted = sp.deleted === "1";
  const page = Number(sp.page ?? 1) || 1;

  const data = await adminService.listUsers({
    search,
    role,
    includeDeleted,
    page,
    pageSize: 25,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("users")}
        description={t("totalCount", { count: data.total })}
      />
      <AdminFilterBar
        basePath="/admin/users"
        initial={{ q: search, role, deleted: includeDeleted }}
        extras={
          <>
            <select
              name="role"
              defaultValue={role ?? ""}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{t("allRoles")}</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                name="deleted"
                value="1"
                defaultChecked={includeDeleted}
              />
              {t("includeDeleted")}
            </label>
          </>
        }
      />
      <AdminTable>
        <thead>
          <tr className="border-b border-white/10 text-left text-muted-foreground">
            <th className="p-3 font-medium">{t("name")}</th>
            <th className="p-3 font-medium">{t("email")}</th>
            <th className="p-3 font-medium">{t("role")}</th>
            <th className="p-3 font-medium">{t("organizations")}</th>
            <th className="p-3 font-medium">{t("status")}</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((user) => (
            <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
              <td className="p-3">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="font-medium text-foreground hover:text-gold"
                >
                  {user.name ?? "—"}
                </Link>
              </td>
              <td className="p-3 text-muted-foreground">{user.email}</td>
              <td className="p-3">{user.platformRole}</td>
              <td className="p-3">{user._count.organizationMembers}</td>
              <td className="p-3">
                {user.deletedAt ? t("deleted") : t("active")}
              </td>
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
          if (role) params.set("role", role);
          if (includeDeleted) params.set("deleted", "1");
          params.set("page", String(p));
          return `/admin/users?${params}`;
        }}
      />
    </div>
  );
}
