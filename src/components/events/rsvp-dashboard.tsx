"use client";

import type { GuestStatus } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { EventPageHeader } from "@/components/events/event-page-header";
import { EventSection } from "@/components/events/event-section";
import { EventStatStrip } from "@/components/events/event-stat-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RsvpStats {
  PENDING: number;
  INVITED: number;
  CONFIRMED: number;
  DECLINED: number;
  MAYBE: number;
  NO_RESPONSE: number;
}

interface RsvpDashboardProps {
  eventId: string;
  stats: RsvpStats;
  totalGuests: number;
  hasResend: boolean;
}

const STATUS_KEYS: Record<GuestStatus, string> = {
  PENDING: "pending",
  INVITED: "invited",
  CONFIRMED: "confirmed",
  DECLINED: "declined",
  MAYBE: "maybe",
  NO_RESPONSE: "noResponse",
};

export function RsvpDashboard({
  eventId,
  stats,
  totalGuests,
  hasResend,
}: RsvpDashboardProps) {
  const t = useTranslations("guests");
  const tRsvp = useTranslations("rsvp");
  const tCommon = useTranslations("common");
  const [isSending, setIsSending] = useState(false);

  const responded =
    stats.CONFIRMED + stats.DECLINED + stats.MAYBE;
  const pending =
    stats.PENDING + stats.INVITED + stats.NO_RESPONSE;
  const rate = totalGuests > 0 ? Math.round((responded / totalGuests) * 100) : 0;

  async function sendInvitations() {
    setIsSending(true);
    try {
      const response = await fetch(`/api/events/${eventId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          type: "INVITATION",
          sendToAll: true,
          channel: "EMAIL",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message);
      toast.success(tRsvp("invitationsSent", { count: result.data.recipientCount }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("error"));
    } finally {
      setIsSending(false);
    }
  }

  async function sendReminders() {
    setIsSending(true);
    try {
      const response = await fetch(`/api/events/${eventId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          type: "RSVP_REMINDER",
          channel: "EMAIL",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message);
      toast.success(tRsvp("remindersSent", { count: result.data.recipientCount }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("error"));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <EventPageHeader
        title={tRsvp("title")}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isSending || !hasResend}
              onClick={() => void sendInvitations()}
            >
              {t("sendInvitation")}
            </Button>
            <Button
              variant="gold"
              size="sm"
              disabled={isSending || !hasResend}
              onClick={() => void sendReminders()}
            >
              {t("sendReminder")}
            </Button>
          </div>
        }
      />

      <EventStatStrip
        stats={[
          { label: tRsvp("responseRate"), value: `${rate}%` },
          { label: tRsvp("responded"), value: responded },
          { label: tRsvp("pending"), value: pending },
        ]}
      />

      <EventSection title={tRsvp("breakdown")}>
        {!hasResend ? (
          <p className="mb-4 text-sm text-amber-700">{tRsvp("noEmailProvider")}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(stats) as [GuestStatus, number][]).map(([status, count]) =>
            count > 0 ? (
              <Badge key={status} variant="secondary">
                {t(`statuses.${STATUS_KEYS[status]}`)}: {count}
              </Badge>
            ) : null,
          )}
        </div>
      </EventSection>
    </div>
  );
}
