import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import { resolveActiveOrganization } from "@/server/auth/organization-guard";
import { orgPath } from "@/lib/org-path";

export default async function LegacyNewEventRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  if (!session?.user?.id) {
    redirect({ href: "/login", locale });
  }

  const active = await resolveActiveOrganization(session!.user.id);

  if (!active) {
    redirect({ href: "/setup", locale });
  }

  redirect({ href: orgPath(active!.slug, "/events/new"), locale });
}
