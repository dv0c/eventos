import { notFound } from "next/navigation";

import { OrgProvider } from "@/components/providers/org-provider";
import { redirect } from "@/i18n/navigation";
import {
  getOrganizationBySlug,
  OrganizationAccessError,
} from "@/server/auth/organization-guard";
import { getSession } from "@/server/auth/session";

export default async function OrgSlugRootLayout({
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

  let activeOrg;

  try {
    activeOrg = await getOrganizationBySlug(session!.user.id, orgSlug);
  } catch (error) {
    if (error instanceof OrganizationAccessError) {
      if (error.code === "ORG_NOT_FOUND") {
        notFound();
      }
      redirect({ href: "/forbidden", locale });
    }
    throw error;
  }

  return (
    <OrgProvider
      orgId={activeOrg.id}
      orgSlug={activeOrg.slug}
      orgName={activeOrg.name}
      planName={activeOrg.planName}
      planSlug={activeOrg.planSlug}
    >
      {children}
    </OrgProvider>
  );
}
