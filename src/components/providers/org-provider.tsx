"use client";

import { createContext, useContext, useMemo } from "react";

import { OrgCookieSync } from "@/components/organization/org-cookie-sync";
import { orgPath } from "@/lib/org-path";

interface OrgContextValue {
  orgId: string;
  orgSlug: string;
  orgName: string;
  planName: string;
  planSlug: string;
}

const OrgContext = createContext<OrgContextValue | null>(null);

interface OrgProviderProps {
  orgId: string;
  orgSlug: string;
  orgName: string;
  planName: string;
  planSlug: string;
  children: React.ReactNode;
}

export function OrgProvider({
  orgId,
  orgSlug,
  orgName,
  planName,
  planSlug,
  children,
}: OrgProviderProps) {
  const value = useMemo(
    () => ({ orgId, orgSlug, orgName, planName, planSlug }),
    [orgId, orgSlug, orgName, planName, planSlug],
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
