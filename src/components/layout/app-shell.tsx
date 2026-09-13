"use client";

import { PlatformRole } from "@prisma/client";
import { useAuth } from "@meindesk/nextjs";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Suspense, useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from "react";

import type { OrganizationSummary } from "@/components/layout/org-switcher";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { EventSidebar } from "@/components/layout/event-sidebar";
import { FreePlanBanner } from "@/components/layout/free-plan-banner";
import { EventSidebarSkeleton } from "@/components/dashboard/org-skeletons";
import { useOptionalOrg } from "@/components/providers/org-provider";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { orgPath } from "@/lib/org-path";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

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

function useOrgDarkTheme(primaryColor?: string | null) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark", "org-app");
    if (primaryColor) {
      root.style.setProperty("--org-primary", primaryColor);
      root.style.setProperty("--primary", primaryColor);
    }
    return () => {
      root.classList.remove("dark", "org-app");
      root.style.removeProperty("--org-primary");
      root.style.removeProperty("--primary");
    };
  }, [primaryColor]);
}

function SidebarTransition({
  workspaceKey,
  className,
  children,
}: {
  workspaceKey: string;
  className?: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={workspaceKey}
        className={cn("flex h-full min-h-0 w-full", className)}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
        transition={{
          duration: reduceMotion ? 0.12 : 0.28,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function AppShell({
  children,
  user,
  organizations,
  activeOrganizationId,
}: AppShellProps) {
  const org = useOptionalOrg();
  useOrgDarkTheme(org?.mode === "B2B" ? org.primaryColor : null);
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAuth();
  const isAdmin = user.platformRole === PlatformRole.ADMIN;
  const eventId = getEventIdFromPath(pathname);
  const isEventWorkspace = Boolean(eventId);
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [eventWorkspaceName, setEventWorkspaceName] = useState<string | null>(null);

  const workspaceKey = isAdminArea
    ? "admin"
    : isEventWorkspace && eventId
      ? `event:${eventId}`
      : "org";

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isEventWorkspace) {
      setEventWorkspaceName(null);
    }
  }, [isEventWorkspace, eventId]);

  const handleActiveEventNameChange = useCallback((name: string | null) => {
    setEventWorkspaceName(name);
  }, []);

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

    setMobileNavOpen(false);
    router.push(orgPath(organization.slug, "/dashboard"));
    router.refresh();
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  function handleCreateOrganization() {
    setMobileNavOpen(false);
    router.push("/organizations/new");
  }

  const sidebarProps = {
    isAdmin,
    userEmail: user.email,
    userName: user.name,
    onNavigate: () => setMobileNavOpen(false),
  };

  function renderSidebar(className: string) {
    if (isAdminArea) {
      return (
        <AdminSidebar
          className={className}
          userEmail={user.email}
          userName={user.name}
          onNavigate={() => setMobileNavOpen(false)}
        />
      );
    }
    if (isEventWorkspace && eventId) {
      return (
        <Suspense fallback={<EventSidebarSkeleton className={className} />}>
          <EventSidebar
            eventId={eventId}
            className={className}
            onActiveEventNameChange={handleActiveEventNameChange}
            {...sidebarProps}
          />
        </Suspense>
      );
    }
    return <AppSidebar className={className} {...sidebarProps} />;
  }

  return (
    <div className="org-app dark relative flex h-screen overflow-hidden bg-neutral-950 text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,oklch(0.28_0.03_55/0.25),transparent_50%)]"
      />
      <div className="relative z-10 flex h-full min-w-0 flex-1 overflow-hidden">
        <div className="relative hidden h-full w-56 shrink-0 overflow-hidden border-r border-white/10 md:block">
          <SidebarTransition workspaceKey={workspaceKey} className="absolute inset-0">
            {renderSidebar("h-full w-full border-0")}
          </SidebarTransition>
        </div>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent
            side="left"
            className="w-[min(100%,18rem)] border-white/10 bg-neutral-950 p-0 text-foreground [&>button]:text-foreground"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarTransition workspaceKey={workspaceKey}>
              {renderSidebar("w-full border-0")}
            </SidebarTransition>
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {isAdminArea ? null : <FreePlanBanner />}
          <AppHeader
            user={user}
            organizations={organizations}
            activeOrganizationId={activeOrganizationId}
            onOrganizationChange={handleOrganizationChange}
            onCreateOrganization={isAdmin ? handleCreateOrganization : undefined}
            onSignOut={handleSignOut}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            compact={isEventWorkspace}
            eventName={isEventWorkspace ? eventWorkspaceName : null}
          />
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-transparent p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
