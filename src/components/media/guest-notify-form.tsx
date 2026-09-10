"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface GuestNotifyFormProps {
  eventId: string;
  className?: string;
  glass?: boolean;
}

export function GuestNotifyForm({
  eventId,
  className,
  glass = false,
}: GuestNotifyFormProps) {
  const t = useTranslations("moderatorAlbum");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const canSend =
    !sending && subject.trim().length > 0 && body.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    try {
      const response = await fetch(`/api/events/${eventId}/wall-announcement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: subject.trim(),
          body: body.trim(),
        }),
      });
      if (!response.ok) {
        const json = await response.json().catch(() => null);
        toast.error(json?.error?.message ?? t("notifyError"));
        setSending(false);
        return;
      }
      toast.success(t("notifySuccess"));
      setSubject("");
      setBody("");
    } catch {
      toast.error(t("notifyError"));
    }
    setSending(false);
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-4", className)}>
      <div>
        <h2
          className={cn(
            "text-lg font-semibold",
            glass ? "text-white" : "text-foreground",
          )}
        >
          {t("notifyTitle")}
        </h2>
        <p
          className={cn(
            "mt-1 text-sm",
            glass ? "text-white/55" : "text-muted-foreground",
          )}
        >
          {t("notifyDesc")}
        </p>
      </div>
      <div className="space-y-2">
        <Label
          htmlFor="guest-notify-subject"
          className={glass ? "text-white/70" : undefined}
        >
          {t("notifySubject")}
        </Label>
        <Input
          id="guest-notify-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={
            glass
              ? "h-12 border-white/15 bg-white/10 text-base text-white placeholder:text-white/40"
              : "h-12 text-base"
          }
          placeholder={t("notifySubjectPlaceholder")}
          disabled={sending}
          maxLength={120}
        />
      </div>
      <div className="space-y-2">
        <Label
          htmlFor="guest-notify-body"
          className={glass ? "text-white/70" : undefined}
        >
          {t("notifyBody")}
        </Label>
        <textarea
          id="guest-notify-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          maxLength={500}
          className={cn(
            "flex w-full rounded-lg border px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            glass
              ? "border-white/15 bg-white/10 text-white placeholder:text-white/40"
              : "border-input bg-background",
          )}
          placeholder={t("notifyBodyPlaceholder")}
          disabled={sending}
        />
      </div>
      <Button
        type="submit"
        variant="default"
        className="h-12 w-full text-base"
        disabled={!canSend}
      >
        <Bell className="mr-2 size-4" />
        {sending ? t("notifySending") : t("notifySend")}
      </Button>
    </form>
  );
}
