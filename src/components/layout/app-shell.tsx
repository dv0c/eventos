"use client";

import { PlatformRole } from "@prisma/client";
import { signOut } from "next-auth/react";

import type { OrganizationSummary } from "@/components/layout/org-switcher";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { orgPath } from "@/lib/org-path";
import { useRouter } from "@/i18n/navigation";

interface AppShellProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    platformRole?: PlatformRole;
  };
  organizations: OrganizationSummary[];
  activeOrganizationId?: string | null;
}

export function AppShell({
  children,
  user,
  organizations,
  activeOrganizationId,
}: AppShellProps) {
  const router = useRouter();
  const isAdmin = user.platformRole === PlatformRole.ADMIN;

  async function handleOrganizationChange(organizationId: string) {
    const organization = organizations.find((org) => org.id === organizationId);

    if (!organization?.slug) {
      return;
    }

    await fetch("/api/organizations/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId }),
    });

    router.push(orgPath(organization.slug, "/dashboard"));
    router.refresh();
  }

  async function handleSignOut() {
    await signOut({ callbackUrl: "/" });
  }

  function handleCreateOrganization() {
    router.push("/organizations/new");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar isAdmin={isAdmin} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          user={user}
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
          onOrganizationChange={handleOrganizationChange}
          onCreateOrganization={handleCreateOrganization}
          onSignOut={handleSignOut}
        />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-secondary/10 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
