import { EventStatus } from "@prisma/client";
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

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const t = await getTranslations("admin");
  const sp = await searchParams;
  const search = typeof sp.q === "string" ? sp.q : undefined;
  const status =
    typeof sp.status === "string" &&
    Object.values(EventStatus).includes(sp.status as EventStatus)
      ? (sp.status as EventStatus)
      : undefined;
  const includeDeleted = sp.deleted === "1";
  const page = Number(sp.page ?? 1) || 1;

  const data = await adminService.listEvents({
    search,
    status,
    includeDeleted,
    page,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("events")}
        description={t("totalCount", { count: data.total })}
      />
      <AdminFilterBar
        basePath="/admin/events"
        initial={{ q: search, status, deleted: includeDeleted }}
        extras={
          <>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{t("allStatuses")}</option>
              {Object.values(EventStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
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
            <th className="p-3 font-medium">{t("eventName")}</th>
            <th className="p-3 font-medium">{t("organization")}</th>
            <th className="p-3 font-medium">{t("status")}</th>
            <th className="p-3 font-medium">{t("media")}</th>
            <th className="p-3 font-medium">{t("date")}</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((event) => (
            <tr key={event.id} className="border-b border-white/5 hover:bg-white/5">
              <td className="p-3">
                <Link
                  href={`/admin/events/${event.id}`}
                  className="font-medium hover:text-gold"
                >
                  {event.name}
                </Link>
              </td>
              <td className="p-3 text-muted-foreground">
                {event.organization.name}
              </td>
              <td className="p-3">{event.status}</td>
              <td className="p-3">{event._count.media}</td>
              <td className="p-3 text-muted-foreground">
                {event.date.toLocaleDateString()}
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
          if (status) params.set("status", status);
          if (includeDeleted) params.set("deleted", "1");
          params.set("page", String(p));
          return `/admin/events?${params}`;
        }}
      />
    </div>
  );
}
