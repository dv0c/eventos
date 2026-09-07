"use client";

import { useLayoutEffect } from "react";

interface ImmersiveShellProps {
  children: React.ReactNode;
}

export function ImmersiveShell({ children }: ImmersiveShellProps) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark", "org-app");
    return () => {
      root.classList.remove("dark", "org-app");
    };
  }, []);

  return (
    <div className="org-app dark relative h-dvh overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_15%_20%,oklch(0.30_0.045_55/0.22),transparent_70%),radial-gradient(ellipse_70%_50%_at_85%_15%,oklch(0.28_0.035_70/0.16),transparent_65%),radial-gradient(ellipse_90%_55%_at_50%_110%,oklch(0.24_0.03_45/0.18),transparent_60%)]"
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
