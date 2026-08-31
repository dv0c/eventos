import { PlatformRole } from "@prisma/client";

import { AppShell } from "@/components/layout/app-shell";
import { redirect } from "@/i18n/navigation";
import { getUserOrganizationsSummary } from "@/server/auth/organization-guard";
import { getSession } from "@/server/auth/session";

export default async function OrgShellLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { locale, orgSlug } = await params;
  const session = await getSession();

  if (!session?.user?.id) {
    redirect({ href: "/login", locale });
  }

  const authUser = session!.user;
  const organizations = await getUserOrganizationsSummary(authUser.id);
  const activeOrganization = organizations.find((org) => org.slug === orgSlug);

  if (!activeOrganization) {
    return redirect({ href: "/forbidden", locale });
  }

  return (
    <AppShell
      user={{
        name: authUser.name,
        email: authUser.email,
        image: authUser.image,
        platformRole: authUser.platformRole as PlatformRole,
      }}
      organizations={organizations}
      activeOrganizationId={activeOrganization.id}
    >
      {children}
    </AppShell>
  );
}
