"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface WizardFormSectionProps {
  sectionKey: string;
  children: ReactNode;
  className?: string;
}

export function WizardFormSection({
  sectionKey,
  children,
  className,
}: WizardFormSectionProps) {
  return (
    <div key={sectionKey} className={cn("wizard-form-section-enter", className)}>
      {children}
    </div>
  );
}
