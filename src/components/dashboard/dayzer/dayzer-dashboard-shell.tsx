"use client";

import { useEffect, useState } from "react";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { DayzerHeader } from "./dayzer-header";
import { DayzerMainCard } from "./dayzer-main-card";
import { DayzerSidebar } from "./dayzer-sidebar";
import { DayzerUtilityRail } from "./dayzer-utility-rail";
import type { DayzerDashboardData } from "./types";

import "./dayzer-tokens.css";

interface DayzerDashboardShellProps {
  data: DayzerDashboardData;
}

export function DayzerDashboardShell({ data }: DayzerDashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    const hadOrg = root.classList.contains("org-app");
    root.classList.remove("dark", "org-app");
    return () => {
      if (hadDark) root.classList.add("dark");
      if (hadOrg) root.classList.add("org-app");
    };
  }, []);

  return (
    <div
      className={cn(
        "dayzer-root flex min-h-dvh w-full items-center justify-center overflow-x-hidden overflow-y-auto",
      )}
      style={{ background: "var(--dz-cream)" }}
    >
      <div
        className="relative mx-auto flex overflow-hidden"
        style={{
          width: 901,
          height: 562,
          maxWidth: "calc(100vw - 24px)",
          maxHeight: "calc(100dvh - 24px)",
          borderRadius: "var(--dz-shell-radius)",
          background: "var(--dz-shell)",
          boxShadow: "var(--dz-shadow)",
        }}
      >
        <div className="hidden h-full shrink-0 md:block" style={{ width: "var(--dz-sidebar-w)" }}>
          <DayzerSidebar data={data} className="!w-full" />
        </div>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent
            side="left"
            className="dayzer-root w-[min(100%,17rem)] border-0 p-0 [&>button]:text-[#111]"
            style={{ background: "var(--dz-shell)" }}
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <DayzerSidebar
              data={data}
              className="!w-full"
              onNavigate={() => setMobileNavOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div
          className="flex min-w-0 flex-1 flex-col overflow-hidden"
          style={{
            paddingLeft: 61,
            paddingRight: 12,
            paddingTop: "var(--dz-main-pad-top)",
            paddingBottom: 18,
          }}
        >
          <DayzerHeader
            eventsHref={data.eventsHref}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />
          <div className="mt-1 flex min-h-0 flex-1 flex-col overflow-hidden">
            <DayzerMainCard data={data} />
          </div>
        </div>

        <DayzerUtilityRail data={data} />
      </div>
    </div>
  );
}
