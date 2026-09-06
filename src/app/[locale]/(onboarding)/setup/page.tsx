import { redirectToActiveOrganizationDashboard } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";

type SetupPageProps = {
  params: Promise<{ locale: string }>;
};

/** Legacy create-org onboarding — users are auto-enrolled into the platform org. */
export default async function SetupOrganizationPage({ params }: SetupPageProps) {
  const { locale } = await params;
  const session = await requireAuth();
  await redirectToActiveOrganizationDashboard(locale, session.user.id);
}
