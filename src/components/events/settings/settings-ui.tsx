"use client";

import { Star, Trash2, Upload } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function useEventPremiumUpgrade(eventId: string, orgSlug: string) {
  const locale = useLocale();
  const t = useTranslations("eventWorkspace.settings");
  const [busy, setBusy] = useState(false);

  async function startUpgrade() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/events/${eventId}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgSlug, locale }),
      });
      const json = await response.json();
      if (!response.ok) {
        toast.error(json.error?.message ?? t("upgradeFailed"));
        return;
      }
      if (json.data?.url) {
        window.location.href = json.data.url as string;
        return;
      }
      toast.error(t("upgradeFailed"));
    } catch {
      toast.error(t("upgradeFailed"));
    } finally {
      setBusy(false);
    }
  }

  return { startUpgrade, upgradeBusy: busy };
}

export function PlusUpgradeBadge({
  variant = "plus",
  className,
  onUpgrade,
  disabled,
}: {
  variant?: "plus" | "pro";
  className?: string;
  onUpgrade?: () => void;
  disabled?: boolean;
}) {
  const t = useTranslations("eventWorkspace.settings");

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <Badge
        variant="outline"
        className="gap-1 border-gold/40 bg-gold/10 px-2 py-0 text-[10px] font-medium text-gold hover:bg-gold/10"
      >
        <Star className="h-2.5 w-2.5 fill-current" />
        {variant === "pro" ? t("proBadge") : t("plusBadge")}
      </Badge>
      {onUpgrade ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onUpgrade}
          className="text-xs font-medium text-primary underline disabled:opacity-50"
        >
          {t("upgradeEvent")}
        </button>
      ) : null}
    </div>
  );
}

export function SettingsRow({
  title,
  description,
  badge,
  isPremium = true,
  onUpgrade,
  upgradeBusy,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  badge?: "plus" | "pro";
  isPremium?: boolean;
  onUpgrade?: () => void;
  upgradeBusy?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const locked = Boolean(badge) && !isPremium;

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
          {locked ? (
            <PlusUpgradeBadge
              variant={badge}
              onUpgrade={onUpgrade}
              disabled={upgradeBusy}
            />
          ) : null}
        </div>
        {description ? (
          <div className="text-sm text-muted-foreground">{description}</div>
        ) : null}
      </div>
      <div
        className={cn(
          "shrink-0 sm:pt-0.5",
          locked && "pointer-events-none opacity-50",
        )}
      >
        {children}
      </div>
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
    <div className="inline-flex gap-0.5 rounded-md border border-white/10 bg-white/[0.02] p-0.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-white/10 text-foreground"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
