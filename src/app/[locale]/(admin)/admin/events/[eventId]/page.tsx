import { getTranslations } from "next-intl/server";

import { AdminEventEditor } from "@/components/admin/admin-event-editor";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/server/auth/session";
import { adminService } from "@/server/services/admin.service";

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  await requireAdmin();
  const { eventId } = await params;
  const t = await getTranslations("admin");
  const event = await adminService.getEvent(eventId);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={event.name}
        description={`${event.organization.name} · ${event.slug}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/e/${event.slug}`}
              className="rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
            >
              {t("openPublic")}
            </Link>
            <Link
              href={`/mod/${event.id}`}
              className="rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
            >
              {t("openMod")}
            </Link>
            <Link
              href="/admin/events"
              className="rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
            >
              {t("backToList")}
            </Link>
          </div>
        }
      />
      <p className="text-sm text-muted-foreground">
        {t("countsSummary", {
          media: event._count.media,
          guests: event._count.guests,
          songs: event._count.songRequests,
          wishes: event._count.voiceWishes,
        })}
      </p>
      <AdminEventEditor event={event} />
    </div>
  );
}
