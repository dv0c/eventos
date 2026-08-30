import { MessageManager } from "@/components/messages/message-manager";
import { requireAuth } from "@/server/auth/session";
import { messageService } from "@/server/services/message.service";

interface MessagesPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventMessagesPage({ params }: MessagesPageProps) {
  const { eventId } = await params;
  const session = await requireAuth();

  const [messages, templates] = await Promise.all([
    messageService.listMessages(session.user.id, eventId),
    messageService.listTemplates(session.user.id, eventId),
  ]);

  const emailConfigured = !!process.env.RESEND_API_KEY;

  return (
    <MessageManager
      eventId={eventId}
      initialMessages={messages.map((msg) => ({
        ...msg,
        scheduledAt: msg.scheduledAt?.toISOString() ?? null,
        sentAt: msg.sentAt?.toISOString() ?? null,
        createdAt: msg.createdAt.toISOString(),
        deliveries: msg.deliveries.map((d) => ({
          ...d,
          sentAt: d.sentAt?.toISOString() ?? null,
        })),
      }))}
      initialTemplates={templates.map((tpl) => ({
        id: "id" in tpl ? tpl.id : undefined,
        name: tpl.name,
        type: tpl.type,
        subject: tpl.subject,
        body: tpl.body,
      }))}
      emailConfigured={emailConfigured}
    />
  );
}
