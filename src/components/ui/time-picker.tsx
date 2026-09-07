"use client";

import { Clock, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

interface TimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  clearLabel?: string;
}

function parseTime(value?: string): { hour: string; minute: string } | null {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [hour, minute] = value.split(":");
  return { hour, minute };
}

function snapMinute(minute: string): string {
  const n = Number(minute);
  if (Number.isNaN(n)) return "00";
  const snapped = Math.round(n / 5) * 5;
  return String(snapped === 60 ? 55 : snapped).padStart(2, "0");
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Pick a time",
  id,
  disabled,
  className,
  clearLabel = "Clear",
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const parsed = parseTime(value);
  const hour = parsed?.hour ?? "12";
  const minute = parsed ? snapMinute(parsed.minute) : "00";

  function commit(nextHour: string, nextMinute: string) {
    onChange(`${nextHour}:${nextMinute}`);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-12 w-full justify-start gap-2 px-4 text-left text-base font-normal",
            !parsed && "text-muted-foreground",
            className,
          )}
        >
          <Clock className="size-4 shrink-0 opacity-70" />
          <span className="flex-1 truncate">{parsed ? value : placeholder}</span>
          {parsed ? (
            <span
              role="button"
              tabIndex={0}
              aria-label={clearLabel}
              className="rounded-md p-0.5 text-muted-foreground hover:bg-accent/20 hover:text-foreground"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onChange("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  onChange("");
                }
              }}
            >
              <X className="size-3.5" />
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="flex gap-2">
          <TimeColumn
            label="Hour"
            options={HOURS}
            value={hour}
            onSelect={(next) => commit(next, minute)}
          />
          <TimeColumn
            label="Min"
            options={MINUTES}
            value={minute}
            onSelect={(next) => commit(hour, next)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TimeColumn({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: string[];
  value: string;
  onSelect: (value: string) => void;
}) {
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const active = root.querySelector<HTMLButtonElement>("[data-active=true]");
    active?.scrollIntoView({ block: "center" });
  }, [value]);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="px-1 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div
        ref={listRef}
        className="h-44 overflow-y-auto rounded-lg border border-border/50 bg-background/40 p-1 dark:border-white/10"
      >
        {options.map((option) => {
          const isActive = option === value;
          return (
            <button
              key={option}
              type="button"
              data-active={isActive || undefined}
              onClick={() => onSelect(option)}
              className={cn(
                "flex w-full items-center justify-center rounded-md px-2 py-1.5 text-sm tabular-nums transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent/15 hover:text-foreground",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
