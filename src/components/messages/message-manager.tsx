"use client";

import type { DeliveryStatus, MessageChannel, MessageType } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Mail, Clock, Inbox } from "lucide-react";

import { EventPageHeader } from "@/components/events/event-page-header";
import { EventSection } from "@/components/events/event-section";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MessageDelivery {
  id: string;
  recipientEmail: string | null;
  status: DeliveryStatus;
  sentAt: string | null;
}

interface MessageRecord {
  id: string;
  channel: MessageChannel;
  type: MessageType;
  subject: string | null;
  status: DeliveryStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  deliveries: MessageDelivery[];
}

interface Template {
  id?: string;
  name: string;
  type: MessageType;
  subject?: string | null;
  body: string;
}

interface MessageManagerProps {
  eventId: string;
  initialMessages: MessageRecord[];
  initialTemplates: Template[];
  emailConfigured: boolean;
}

export function MessageManager({
  eventId,
  initialMessages,
  initialTemplates,
  emailConfigured,
}: MessageManagerProps) {
  const t = useTranslations("messages");
  const tCommon = useTranslations("common");

  const [messages, setMessages] = useState(initialMessages);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    initialTemplates[0]?.id ?? initialTemplates[0]?.name ?? "",
  );
  const [isSending, setIsSending] = useState(false);

  const refreshMessages = useCallback(async () => {
    const response = await fetch(`/api/events/${eventId}/messages`);
    if (response.ok) {
      const json = await response.json();
      setMessages(json.data.messages);
    }
  }, [eventId]);

  async function sendMessage(type: MessageType) {
    setIsSending(true);

    const template = initialTemplates.find(
      (tpl) => (tpl.id ?? tpl.name) === selectedTemplate,
    );

    try {
      const response = await fetch(`/api/events/${eventId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          type,
          sendToAll: true,
          channel: "EMAIL",
          subject: template?.subject,
          body: template?.body,
          templateId: template?.id,
        }),
      });

      if (!response.ok) {
        const json = await response.json();
        toast.error(json.error?.message ?? t("sendError"));
        setIsSending(false);
        return;
      }

      const json = await response.json();
      toast.success(t("sendSuccess", { count: json.data.recipientCount }));
      await refreshMessages();
    } catch {
      toast.error(t("sendError"));
    }

    setIsSending(false);
  }

  const statusVariant: Record<DeliveryStatus, "default" | "secondary" | "outline" | "destructive"> = {
    QUEUED: "outline",
    SENT: "secondary",
    DELIVERED: "default",
    READ: "default",
    FAILED: "destructive",
    BOUNCED: "destructive",
  };

  return (
    <div className="space-y-6">
      <EventPageHeader title={t("title")} />

      {!emailConfigured ? (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          {t("emailNotConfigured")}
        </div>
      ) : null}

      <EventSection title={t("sendCampaign")}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("selectTemplate")}</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectTemplate")} />
              </SelectTrigger>
              <SelectContent>
                {initialTemplates.map((tpl) => (
                  <SelectItem key={tpl.id ?? tpl.name} value={tpl.id ?? tpl.name}>
                    {tpl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="gold"
              disabled={!emailConfigured || isSending}
              onClick={() => sendMessage("INVITATION")}
            >
              <Mail className="mr-2 h-4 w-4" />
              {t("sendInvitation")}
            </Button>
            <Button
              variant="outline"
              disabled={!emailConfigured || isSending}
              onClick={() => sendMessage("RSVP_REMINDER")}
            >
              <Clock className="mr-2 h-4 w-4" />
              {t("sendReminder")}
            </Button>
          </div>
        </div>
      </EventSection>

      <EventSection title={t("history")}>
        {messages.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={t("noMessages")}
            className="border-0 bg-transparent py-8"
          />
        ) : (
          <ul className="divide-y divide-border/50">
            {messages.map((msg) => (
              <li key={msg.id} className="flex items-start justify-between gap-4 py-4 first:pt-0">
                <div>
                  <p className="font-medium">{msg.subject ?? msg.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("recipientCount", { count: msg.deliveries.length })}
                  </p>
                  {msg.scheduledAt ? (
                    <p className="text-xs text-muted-foreground">
                      {t("scheduled")}: {new Date(msg.scheduledAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>
                <Badge variant={statusVariant[msg.status]}>
                  {t(`status.${msg.status.toLowerCase()}` as "status.queued")}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </EventSection>
    </div>
  );
}
