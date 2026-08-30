"use client";

import type { GuestStatus } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      toast.error(error instanceof Error ? error.message : "Failed");
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
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{tRsvp("title")}</h1>
        <p className="text-muted-foreground">{tRsvp("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {tRsvp("responseRate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{rate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {tRsvp("responded")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{responded}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {tRsvp("pending")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pending}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{tRsvp("breakdown")}</CardTitle>
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
        </CardHeader>
        <CardContent>
          {!hasResend ? (
            <p className="mb-4 text-sm text-amber-600">{tRsvp("noEmailProvider")}</p>
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
        </CardContent>
      </Card>
    </div>
  );
}
