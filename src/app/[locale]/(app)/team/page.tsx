import { Mail, UsersRound } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import {
  getActiveOrganizationId,
  requireAuth,
} from "@/server/auth/session";
import { organizationRepository } from "@/server/repositories/organization.repository";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("team");
  const session = await requireAuth();
  const organizationId = await getActiveOrganizationId();

  if (!organizationId) {
    return (
      <EmptyState icon={UsersRound} title={t("noTeam")} description={t("noTeamDesc")} />
    );
  }

  const members = await organizationRepository.getMembers(organizationId);
  const pendingInvites = await import("@/server/db").then(({ prisma }) =>
    prisma.organizationInvite.findMany({
      where: { organizationId, status: "PENDING", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">{t("members")}</h2>
        <Card className="surface-elevated">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="p-4 font-medium">{t("name")}</th>
                  <th className="p-4 font-medium">{t("email")}</th>
                  <th className="p-4 font-medium">{t("role")}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-border/40">
                    <td className="p-4 font-medium">
                      {member.user.name ?? "—"}
                    </td>
                    <td className="p-4 text-muted-foreground">{member.user.email}</td>
                    <td className="p-4">
                      <Badge variant="secondary">{member.role}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {pendingInvites.length > 0 ? (
        <div>
          <h2 className="mb-4 text-lg font-semibold">{t("pendingInvites")}</h2>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <Card key={invite.id} className="surface-elevated">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{invite.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{invite.role}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {t("expires")} {formatDate(invite.expiresAt, locale as "el" | "en")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
