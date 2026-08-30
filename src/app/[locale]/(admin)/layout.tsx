import { PlatformRole } from "@prisma/client";

import { AppShell } from "@/components/layout/app-shell";
import { redirect } from "@/i18n/navigation";
import {
  getActiveOrganizationId,
  getSession,
} from "@/server/auth/session";
import { organizationRepository } from "@/server/repositories/organization.repository";

export default async function AdminGroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  if (!session?.user?.id) {
    redirect({ href: "/login", locale });
  }

  const authUser = session!.user;
  const memberships = await organizationRepository.getUserOrganizations(authUser.id);

  const organizations = memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    logoUrl: m.organization.logoUrl,
  }));

  let activeOrganizationId = await getActiveOrganizationId();
  if (!activeOrganizationId && organizations.length > 0) {
    activeOrganizationId = organizations[0].id;
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
      activeOrganizationId={activeOrganizationId}
    >
      {children}
    </AppShell>
  );
}
