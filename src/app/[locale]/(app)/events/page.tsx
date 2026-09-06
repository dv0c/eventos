import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import { resolveActiveOrganization } from "@/server/auth/organization-guard";
import { orgPath } from "@/lib/org-path";
import { platformOrgService } from "@/server/services/platform-org.service";

export default async function LegacyEventsRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  if (!session?.user?.id) {
    redirect({ href: "/login", locale });
  }

  let active = await resolveActiveOrganization(session!.user.id);

  if (!active) {
    await platformOrgService.ensurePersonalOrganization(session!.user.id);
    active = await resolveActiveOrganization(session!.user.id);
  }

  if (!active) {
    redirect({ href: "/dashboard", locale });
  }

  redirect({ href: orgPath(active!.slug, "/events"), locale });
}
