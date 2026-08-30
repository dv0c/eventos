import { notFound } from "next/navigation";

import { PublicRsvpForm } from "@/components/events/public-rsvp-form";
import { rsvpService } from "@/server/services/rsvp.service";

interface PublicRsvpPageProps {
  params: Promise<{ eventSlug: string; token: string }>;
}

export default async function PublicRsvpPage({ params }: PublicRsvpPageProps) {
  const { token } = await params;

  try {
    const data = await rsvpService.getByToken(token);
    const primaryColor = data.event.theme?.primaryColor ?? "#8B5CF6";

    return (
      <div
        className="min-h-screen px-4 py-12"
        style={{
          background: `linear-gradient(180deg, ${primaryColor}22 0%, transparent 40%)`,
        }}
      >
        <PublicRsvpForm
          token={token}
          guestName={`${data.guest.firstName} ${data.guest.lastName}`}
          eventName={data.event.name}
          allowMaybe={data.event.settings?.allowMaybe ?? false}
          allowChildren={data.event.settings?.allowChildren ?? false}
          currentStatus={data.guest.status}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
