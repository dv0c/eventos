import { Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { InviteMemberForm } from "@/components/organization/invite-member-form";
import { OrgPageHeader } from "@/components/organization/org-page-header";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { organizationRepository } from "@/server/repositories/organization.repository";
import { prisma } from "@/server/db";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { locale, orgSlug } = await params;
  const t = await getTranslations("team");
  const session = await requireAuth();
  const organizationId = (await getOrganizationBySlug(session.user.id, orgSlug)).id;

  const members = await organizationRepository.getMembers(organizationId);
  const pendingInvites = await prisma.organizationInvite.findMany({
    where: { organizationId, status: "PENDING", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <OrgPageHeader title={t("title")} description={t("subtitle")} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">{t("inviteMember")}</h2>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <InviteMemberForm />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">{t("members")}</h2>
        <div className="overflow-hidden rounded-lg border border-white/10">
          {/* Desktop */}
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b border-white/10 text-left text-[12px] text-muted-foreground">
                <th className="px-4 py-3 font-medium">{t("name")}</th>
                <th className="px-4 py-3 font-medium">{t("email")}</th>
                <th className="px-4 py-3 font-medium">{t("role")}</th>
                <th className="px-4 py-3 font-medium">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="px-4 py-3 font-medium">
                    {member.user.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {member.user.email}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className="rounded-md border-white/15 bg-white/5 text-[11px] font-medium text-muted-foreground"
                    >
                      {member.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t("active")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile */}
          <div className="divide-y divide-white/5 md:hidden">
            {members.map((member) => (
              <div key={member.id} className="px-4 py-3">
                <p className="font-medium">{member.user.name ?? "—"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {member.user.email}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-md border-white/15 bg-white/5 text-[11px] font-medium text-muted-foreground"
                  >
                    {member.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{t("active")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {pendingInvites.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight">{t("pendingInvites")}</h2>
          <div className="overflow-hidden rounded-lg border border-white/10 divide-y divide-white/5">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm">{invite.email}</span>
                </div>
                <div className="flex items-center gap-2 pl-6 sm:pl-0">
                  <Badge
                    variant="outline"
                    className="rounded-md border-white/15 bg-transparent text-[11px] text-muted-foreground"
                  >
                    {invite.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {t("expires")} {formatDate(invite.expiresAt, locale as "el" | "en")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
