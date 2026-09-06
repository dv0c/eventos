import { mediaService } from "@/server/services/media.service";

interface RouteContext {
  params: Promise<{ eventSlug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { eventSlug } = await context.params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastMediaPoll = new Date(0);
      let lastReactionPoll = new Date();
      let lastAnnouncementId: string | null = null;

      const poll = async () => {
        try {
          const [media, reactions, announcement] = await Promise.all([
            mediaService.getWallMedia(eventSlug, lastMediaPoll),
            mediaService.getWallReactions(eventSlug, lastReactionPoll),
            mediaService.getWallAnnouncement(eventSlug),
          ]);

          const now = new Date();
          const hasMedia = media.length > 0;
          const hasReactions = reactions.length > 0;
          const freshAnnouncement =
            announcement && announcement.id !== lastAnnouncementId ? announcement : null;

          if (hasMedia || hasReactions || freshAnnouncement) {
            if (hasMedia) lastMediaPoll = now;
            if (hasReactions) lastReactionPoll = now;
            if (freshAnnouncement) lastAnnouncementId = freshAnnouncement.id;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  media: hasMedia ? media : [],
                  reactions: hasReactions ? reactions : [],
                  announcement: freshAnnouncement,
                })}\n\n`,
              ),
            );
          } else {
            controller.enqueue(encoder.encode(": keepalive\n\n"));
          }
        } catch {
          controller.enqueue(encoder.encode(": error\n\n"));
        }
      };

      const initialMedia = await mediaService.getAllWallMedia(eventSlug);

      // Never replay announcements on connect/refresh — only via live poll deltas.
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            media: initialMedia,
            reactions: [],
            initial: true,
          })}\n\n`,
        ),
      );
      lastMediaPoll = new Date();
      lastReactionPoll = new Date();

      const interval = setInterval(poll, 5000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
