"use client";

import { PlatformRole } from "@prisma/client";
import { signOut } from "next-auth/react";
import { Suspense, useLayoutEffect } from "react";

import type { OrganizationSummary } from "@/components/layout/org-switcher";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { EventSidebar } from "@/components/layout/event-sidebar";
import { FreePlanBanner } from "@/components/layout/free-plan-banner";
import { EventSidebarSkeleton } from "@/components/dashboard/org-skeletons";
import { orgPath } from "@/lib/org-path";
import { usePathname, useRouter } from "@/i18n/navigation";

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

function getEventIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/org\/[^/]+\/events\/([^/]+)/);
  if (!match) return null;
  const eventId = match[1];
  if (eventId === "new") return null;
  return eventId;
}

function useOrgDarkTheme() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark", "org-app");
    return () => {
      root.classList.remove("dark", "org-app");
    };
  }, []);
}

export function AppShell({
  children,
  user,
  organizations,
  activeOrganizationId,
}: AppShellProps) {
  useOrgDarkTheme();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = user.platformRole === PlatformRole.ADMIN;
  const eventId = getEventIdFromPath(pathname);
  const isEventWorkspace = Boolean(eventId);

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
    <div className="org-app dark relative flex h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,oklch(0.32_0.06_55/0.45),transparent_55%),radial-gradient(ellipse_at_90%_10%,oklch(0.28_0.05_75/0.35),transparent_50%),radial-gradient(ellipse_at_50%_100%,oklch(0.22_0.04_40/0.4),transparent_55%)]"
      />
      <div className="relative z-10 flex h-full min-w-0 flex-1 overflow-hidden">
        {isEventWorkspace && eventId ? (
          <Suspense fallback={<EventSidebarSkeleton />}>
            <EventSidebar
              eventId={eventId}
              userEmail={user.email}
              userName={user.name}
            />
          </Suspense>
        ) : (
          <AppSidebar isAdmin={isAdmin} userEmail={user.email} userName={user.name} />
        )}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <FreePlanBanner />
          {!isEventWorkspace ? (
            <AppHeader
              user={user}
              organizations={organizations}
              activeOrganizationId={activeOrganizationId}
              onOrganizationChange={handleOrganizationChange}
              onCreateOrganization={isAdmin ? handleCreateOrganization : undefined}
              onSignOut={handleSignOut}
            />
          ) : null}
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-transparent p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
