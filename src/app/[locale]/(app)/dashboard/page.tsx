import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import { redirectToActiveOrganizationDashboard } from "@/server/auth/organization-guard";

export default async function LegacyDashboardRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  if (!session?.user?.id) {
    redirect({ href: "/login", locale });
  }

  await redirectToActiveOrganizationDashboard(locale, session!.user.id);
}
