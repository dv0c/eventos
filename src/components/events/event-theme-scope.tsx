"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface EventThemeColors {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
}

export const EVENTOS_DEFAULT_THEME = {
  primaryColor: "#C4A574",
  secondaryColor: "#F59E0B",
  accentColor: "#E8C9A0",
} as const;

export function eventThemeStyle(colors: EventThemeColors): CSSProperties {
  const primary =
    colors.primaryColor?.trim() || EVENTOS_DEFAULT_THEME.primaryColor;
  const secondary =
    colors.secondaryColor?.trim() || EVENTOS_DEFAULT_THEME.secondaryColor;
  const accent = colors.accentColor?.trim() || primary;

  return {
    "--event-primary": primary,
    "--event-secondary": secondary,
    "--event-accent": accent,
    "--primary": primary,
    "--primary-foreground": "#ffffff",
    "--ring": primary,
    "--accent": accent,
  } as CSSProperties;
}

export function EventThemeScope({
  colors,
  children,
  className,
}: {
  colors: EventThemeColors;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(className)} style={eventThemeStyle(colors)}>
      {children}
    </div>
  );
}
