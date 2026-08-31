"use client";

import { useEffect, useRef } from "react";

interface OrgCookieSyncProps {
  organizationId: string;
}

export function OrgCookieSync({ organizationId }: OrgCookieSyncProps) {
  const syncedOrgId = useRef<string | null>(null);

  useEffect(() => {
    if (syncedOrgId.current === organizationId) {
      return;
    }

    syncedOrgId.current = organizationId;

    void fetch("/api/organizations/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId }),
    });
  }, [organizationId]);

  return null;
}
