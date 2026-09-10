"use client";

import { Star, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { useOptionalOrg } from "@/components/providers/org-provider";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { orgPath } from "@/lib/org-path";
import { cn } from "@/lib/utils";

export function PlusUpgradeBadge({
  variant = "plus",
  className,
  upgradeHref,
}: {
  variant?: "plus" | "pro";
  className?: string;
  upgradeHref?: string;
}) {
  const t = useTranslations("eventWorkspace.settings");
  const org = useOptionalOrg();
  const billingHref =
    upgradeHref ?? (org ? orgPath(org.orgSlug, "/billing") : "/pricing");

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <Badge variant="gold" className="gap-1 px-2 py-0 text-[10px]">
        <Star className="h-2.5 w-2.5 fill-current" />
        {variant === "pro" ? t("proBadge") : t("plusBadge")}
      </Badge>
      <Link
        href={billingHref}
        className="text-xs font-medium text-primary underline"
      >
        {t("upgrade")}
      </Link>
    </div>
  );
}

export function SettingsRow({
  title,
  description,
  badge,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  badge?: "plus" | "pro";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border/50 py-5 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6 dark:border-white/10",
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {badge ? <PlusUpgradeBadge variant={badge} /> : null}
        </div>
        {description ? (
          <div className="text-sm text-muted-foreground">{description}</div>
        ) : null}
      </div>
      <div className="shrink-0 sm:pt-0.5">{children}</div>
    </div>
  );
}

export function DashedUploadBox({
  label,
  previewUrl,
  onFile,
  onOpen,
  onRemove,
  removeLabel,
  disabled,
  className,
}: {
  label: string;
  previewUrl?: string | null;
  onFile?: (file: File) => void;
  /** When set, clicking opens a custom upload flow (e.g. MediaUploadModal) instead of a file input. */
  onOpen?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  const boxClass = cn(
    "flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-md border border-dashed border-border bg-muted/20 text-center text-xs text-muted-foreground transition-colors hover:bg-muted/40 dark:border-white/20 dark:bg-black/30 dark:hover:bg-black/45",
    disabled && "pointer-events-none opacity-60",
  );

  return (
    <div className={cn("flex items-start gap-2", className)}>
      {onOpen ? (
        <button
          type="button"
          className={boxClass}
          disabled={disabled}
          onClick={onOpen}
          aria-label={label}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <>
              <Upload className="size-5 opacity-70" aria-hidden />
              <span>{label}</span>
            </>
          )}
        </button>
      ) : (
        <label className={boxClass}>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <>
              <Upload className="size-5 opacity-70" aria-hidden />
              <span>{label}</span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile?.(file);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {previewUrl && onRemove ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className="inline-flex size-8 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10"
          aria-label={removeLabel ?? "Remove"}
          title={removeLabel ?? "Remove"}
        >
          <Trash2 className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex gap-1.5 rounded-full border border-white/10 bg-black/35 p-1 backdrop-blur-md">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-white/20 bg-black/45 text-foreground backdrop-blur-md"
                : "border-transparent text-muted-foreground hover:bg-white/10 hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
