import { MediaStatus } from "@prisma/client";
import { getTranslations } from "next-intl/server";

import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminMediaActions } from "@/components/admin/admin-media-actions";
import {
  AdminPageHeader,
  AdminPagination,
} from "@/components/admin/admin-ui";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/server/auth/session";
import { adminService } from "@/server/services/admin.service";

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const t = await getTranslations("admin");
  const sp = await searchParams;
  const tab = sp.tab === "wishes" ? "wishes" : "media";
  const search = typeof sp.q === "string" ? sp.q : undefined;
  const status =
    typeof sp.status === "string" &&
    Object.values(MediaStatus).includes(sp.status as MediaStatus)
      ? (sp.status as MediaStatus)
      : undefined;
  const page = Number(sp.page ?? 1) || 1;

  const data =
    tab === "wishes"
      ? await adminService.listVoiceWishes({ page, pageSize: 24 })
      : await adminService.listMedia({ search, status, page, pageSize: 24 });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("media")}
        description={t("totalCount", { count: data.total })}
        actions={
          <div className="flex gap-2">
            <Link
              href="/admin/media"
              className={`rounded-full px-3 py-1.5 text-sm ${
                tab === "media"
                  ? "border border-gold/40 bg-gold/10 text-gold"
                  : "border border-white/15"
              }`}
            >
              {t("media")}
            </Link>
            <Link
              href="/admin/media?tab=wishes"
              className={`rounded-full px-3 py-1.5 text-sm ${
                tab === "wishes"
                  ? "border border-gold/40 bg-gold/10 text-gold"
                  : "border border-white/15"
              }`}
            >
              {t("voiceWishes")}
            </Link>
          </div>
        }
      />

      {tab === "media" ? (
        <AdminFilterBar
          basePath="/admin/media"
          initial={{ q: search, status }}
          extras={
            <select
              name="status"
              defaultValue={status ?? ""}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{t("allStatuses")}</option>
              {Object.values(MediaStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          }
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tab === "media"
          ? (
              data.items as Awaited<
                ReturnType<typeof adminService.listMedia>
              >["items"]
            ).map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-black/30"
              >
                <div className="aspect-video bg-black/50">
                  {item.mimeType.startsWith("video/") ? (
                    <video src={item.url} className="h-full w-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.fileName}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <p className="truncate text-sm font-medium">{item.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.event.name} · {item.event.organization.name}
                  </p>
                  <p className="text-xs">{item.status}</p>
                  <AdminMediaActions id={item.id} />
                </div>
              </div>
            ))
          : (
              data.items as Awaited<
                ReturnType<typeof adminService.listVoiceWishes>
              >["items"]
            ).map((item) => (
              <div
                key={item.id}
                className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3"
              >
                <audio src={item.url} controls className="w-full" />
                <p className="text-sm font-medium">
                  {item.uploadedBy ?? item.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.event.name} · {item.event.organization.name}
                </p>
                <AdminMediaActions id={item.id} kind="wish" />
              </div>
            ))}
      </div>

      <AdminPagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        hrefForPage={(p) => {
          const params = new URLSearchParams();
          if (tab === "wishes") params.set("tab", "wishes");
          if (search) params.set("q", search);
          if (status) params.set("status", status);
          params.set("page", String(p));
          return `/admin/media?${params}`;
        }}
      />
    </div>
  );
}
