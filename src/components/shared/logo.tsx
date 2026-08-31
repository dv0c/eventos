import Image from "next/image";

import { cn } from "@/lib/utils";

type LogoVariant = "full" | "mark";
type LogoTheme = "default" | "light";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: LogoSize;
  className?: string;
  priority?: boolean;
}

const LOGO_SOURCES: Record<LogoVariant, Record<LogoTheme, string>> = {
  full: {
    default: "/brand/logo-full.png",
    light: "/brand/logo-light.png",
  },
  mark: {
    default: "/brand/logo-mark.png",
    light: "/brand/logo-mark.png",
  },
};

const LOGO_DIMENSIONS: Record<LogoVariant, { width: number; height: number }> = {
  full: { width: 413, height: 140 },
  mark: { width: 512, height: 512 },
};

const LOGO_SIZE_CLASSES: Record<LogoSize, Record<LogoVariant, string>> = {
  sm: { full: "h-10", mark: "h-12" },
  md: { full: "h-12", mark: "h-14" },
  lg: { full: "h-14", mark: "h-16" },
};

export function Logo({
  variant = "full",
  theme = "default",
  size = "md",
  className,
  priority = false,
}: LogoProps) {
  const src = LOGO_SOURCES[variant][theme];
  const { width, height } = LOGO_DIMENSIONS[variant];

  return (
    <Image
      src={src}
      alt="Eventos"
      width={width}
      height={height}
      priority={priority}
      className={cn("w-auto object-contain", LOGO_SIZE_CLASSES[size][variant], className)}
    />
  );
}
