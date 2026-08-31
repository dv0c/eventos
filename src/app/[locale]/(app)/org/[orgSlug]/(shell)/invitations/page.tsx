import { Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { orgPath } from "@/lib/org-path";
import { prisma } from "@/server/db";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { enforceOrganizationAccess } from "@/server/permissions/enforce";

export default async function InvitationsPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { locale, orgSlug } = await params;
  const t = await getTranslations("invitations");
  const session = await requireAuth();
  const organizationId = (await getOrganizationBySlug(session.user.id, orgSlug)).id;

  await enforceOrganizationAccess(session.user.id, organizationId, "org:read");

  const invitations = await prisma.invitation.findMany({
    where: {
      event: { organizationId, deletedAt: null },
    },
    include: {
      guest: { select: { firstName: true, lastName: true, email: true, status: true } },
      event: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {invitations.length === 0 ? (
        <EmptyState icon={Mail} title={t("noInvitations")} description={t("noInvitationsDesc")} />
      ) : (
        <Card className="surface-elevated">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="p-4 font-medium">{t("guest")}</th>
                  <th className="p-4 font-medium">{t("event")}</th>
                  <th className="p-4 font-medium">{t("sentAt")}</th>
                  <th className="p-4 font-medium">{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/40">
                    <td className="p-4">
                      <p className="font-medium">
                        {inv.guest.firstName} {inv.guest.lastName}
                      </p>
                      <p className="text-muted-foreground">{inv.guest.email ?? "—"}</p>
                    </td>
                    <td className="p-4">
                      <Link
                        href={orgPath(orgSlug, `/events/${inv.event.id}/overview`)}
                        className="text-primary hover:underline"
                      >
                        {inv.event.name}
                      </Link>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {inv.sentAt
                        ? formatDate(inv.sentAt, locale as "el" | "en")
                        : t("notSent")}
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{inv.guest.status}</Badge>
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
