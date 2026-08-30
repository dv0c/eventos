"use client";

import { RsvpStatus } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PublicRsvpFormProps {
  token: string;
  guestName: string;
  eventName: string;
  allowMaybe: boolean;
  allowChildren: boolean;
  currentStatus: string;
}

export function PublicRsvpForm({
  token,
  guestName,
  eventName,
  allowMaybe,
  allowChildren,
  currentStatus,
}: PublicRsvpFormProps) {
  const t = useTranslations("guests");
  const tRsvp = useTranslations("rsvp");
  const [status, setStatus] = useState<RsvpStatus | null>(null);
  const [partySize, setPartySize] = useState(1);
  const [children, setChildren] = useState(0);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(selected: RsvpStatus) {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/public/rsvp/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selected,
          partySize,
          children: allowChildren ? children : 0,
          dietary: dietary || null,
          message: message || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message);
      setStatus(selected);
      setSubmitted(true);
      toast.success(tRsvp("thankYou"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted && status) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <h2 className="text-2xl font-bold">{tRsvp("thankYou")}</h2>
        <p className="mt-2 text-muted-foreground">
          {t(`rsvpStatuses.${status === RsvpStatus.YES ? "yes" : status === RsvpStatus.NO ? "no" : "maybe"}`)}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-xl border bg-card p-6 shadow-sm">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">{eventName}</p>
        <h1 className="mt-1 text-2xl font-bold">
          {tRsvp("greeting", { name: guestName })}
        </h1>
        {currentStatus !== "PENDING" ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {tRsvp("currentResponse")}: {currentStatus}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3">
        <div>
          <Label>{tRsvp("partySize")}</Label>
          <Input
            type="number"
            min={1}
            value={partySize}
            onChange={(e) => setPartySize(Number.parseInt(e.target.value, 10) || 1)}
          />
        </div>
        {allowChildren ? (
          <div>
            <Label>{tRsvp("children")}</Label>
            <Input
              type="number"
              min={0}
              value={children}
              onChange={(e) => setChildren(Number.parseInt(e.target.value, 10) || 0)}
            />
          </div>
        ) : null}
        <div>
          <Label>{t("dietary")}</Label>
          <Input value={dietary} onChange={(e) => setDietary(e.target.value)} />
        </div>
        <div>
          <Label>{tRsvp("message")}</Label>
          <Input value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="flex-1"
          variant="gold"
          disabled={isSubmitting}
          onClick={() => void handleSubmit(RsvpStatus.YES)}
        >
          {t("rsvpStatuses.yes")}
        </Button>
        {allowMaybe ? (
          <Button
            className="flex-1"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => void handleSubmit(RsvpStatus.MAYBE)}
          >
            {t("rsvpStatuses.maybe")}
          </Button>
        ) : null}
        <Button
          className="flex-1"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => void handleSubmit(RsvpStatus.NO)}
        >
          {t("rsvpStatuses.no")}
        </Button>
      </div>
    </div>
  );
}
