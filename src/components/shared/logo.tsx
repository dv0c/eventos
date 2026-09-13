import { cn } from "@/lib/utils";

type LogoVariant = "full" | "mark";
type LogoTheme = "default" | "light";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: LogoSize;
  className?: string;
  /** Kept for API compatibility with prior Image-based logo. */
  priority?: boolean;
}

const MARK_SIZE: Record<LogoSize, string> = {
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

const WORDMARK_SIZE: Record<LogoSize, string> = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
};

function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect x="2" y="2" width="28" height="28" rx="8" className="fill-current opacity-20" />
      <path
        d="M10 8.5h12.5v2.4H13.1v3.4h8.2v2.4h-8.2v4.3H22.5V23.5H10V8.5Z"
        className="fill-current"
      />
    </svg>
  );
}

export function Logo({
  variant = "full",
  theme = "default",
  size = "md",
  className,
}: LogoProps) {
  const tone = theme === "light" ? "text-white" : "text-foreground";

  if (variant === "mark") {
    return (
      <span className={cn("inline-flex items-center", tone, className)} aria-label="Eventos">
        <BrandMark className={MARK_SIZE[size]} />
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex items-center gap-2.5", tone, className)}
      aria-label="Eventos"
    >
      <BrandMark className={MARK_SIZE[size]} />
      <span
        className={cn(
          "font-[family-name:var(--font-display)] font-semibold tracking-tight leading-none",
          WORDMARK_SIZE[size],
        )}
      >
        Eventos
      </span>
    </span>
  );
}
