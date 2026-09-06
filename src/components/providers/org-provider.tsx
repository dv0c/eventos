"use client";

import { createContext, useContext, useMemo } from "react";
import type { OrgRole } from "@prisma/client";

import { OrgCookieSync } from "@/components/organization/org-cookie-sync";
import { orgPath } from "@/lib/org-path";

interface OrgContextValue {
  orgId: string;
  orgSlug: string;
  orgName: string;
  planName: string;
  planSlug: string;
  orgRole: OrgRole;
}

const OrgContext = createContext<OrgContextValue | null>(null);

interface OrgProviderProps {
  orgId: string;
  orgSlug: string;
  orgName: string;
  planName: string;
  planSlug: string;
  orgRole: OrgRole;
  children: React.ReactNode;
}

export function OrgProvider({
  orgId,
  orgSlug,
  orgName,
  planName,
  planSlug,
  orgRole,
  children,
}: OrgProviderProps) {
  const value = useMemo(
    () => ({ orgId, orgSlug, orgName, planName, planSlug, orgRole }),
    [orgId, orgSlug, orgName, planName, planSlug, orgRole],
  );

  return (
    <OrgContext.Provider value={value}>
      <OrgCookieSync organizationId={orgId} />
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg(): OrgContextValue {
  const context = useContext(OrgContext);

  if (!context) {
    throw new Error("useOrg must be used within OrgProvider");
  }

  return context;
}

export function useOptionalOrg(): OrgContextValue | null {
  return useContext(OrgContext);
}

export function useOrgPath(path: string): string {
  const { orgSlug } = useOrg();
  return orgPath(orgSlug, path);
}
