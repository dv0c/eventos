"use client";

import { AuthProvider } from "@meindesk/nextjs";
import type { ReactNode } from "react";

export function MeindeskAuthProvider({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
