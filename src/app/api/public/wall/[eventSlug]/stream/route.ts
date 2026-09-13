import { isEventEnded } from "@/server/events/event-ended";
import { revokeGuestConnectIfEnded } from "@/server/events/revoke-guest-connect";
import { mediaService } from "@/server/services/media.service";
import { eventRepository } from "@/server/repositories/event.repository";

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
      let wasPanic = false;
      let ended = false;

      const emitEnded = () => {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              media: [],
              removed: [],
              reactions: [],
              announcement: null,
              panic: false,
              ended: true,
              initial: true,
            })}\n\n`,
          ),
        );
      };

      const poll = async () => {
        if (ended) return;

        try {
          const event = await eventRepository.findBySlugPublic(eventSlug);
          if (!event) {
            ended = true;
            emitEnded();
            return;
          }

          if (isEventEnded(event)) {
            ended = true;
            await revokeGuestConnectIfEnded(event.id);
            emitEnded();
            return;
          }

          const panic = Boolean(event.mediaPanicAt);

          if (panic) {
            wasPanic = true;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  media: [],
                  removed: [],
                  reactions: [],
                  announcement: null,
                  panic: true,
                })}\n\n`,
              ),
            );
            return;
          }

          // After panic clears, push a full snapshot — delta poll alone cannot
          // restore media wiped on the client while the wall was paused.
          if (wasPanic) {
            wasPanic = false;
            const allMedia = await mediaService.getAllWallMedia(eventSlug);
            lastMediaPoll = new Date();
            lastReactionPoll = new Date();
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  media: allMedia,
                  removed: [],
                  reactions: [],
                  announcement: null,
                  initial: true,
                  panic: false,
                })}\n\n`,
              ),
            );
            return;
          }

          const [media, removed, reactionBatch, announcement, reactionCountMap] =
            await Promise.all([
              mediaService.getWallMedia(eventSlug, lastMediaPoll),
              mediaService.getWallRemovedMediaIds(eventSlug, lastMediaPoll),
              mediaService.getWallReactions(eventSlug, lastReactionPoll),
              mediaService.getWallAnnouncement(eventSlug),
              mediaService.getWallReactionCountMap(eventSlug),
            ]);

          const now = new Date();
          const reactions = reactionBatch.events;
          const hasMedia = media.length > 0;
          const hasRemoved = removed.length > 0;
          const hasReactions = reactions.length > 0;
          const freshAnnouncement =
            announcement && announcement.id !== lastAnnouncementId ? announcement : null;

          if (hasMedia || hasRemoved || hasReactions || freshAnnouncement) {
            if (hasMedia || hasRemoved) lastMediaPoll = now;
            if (hasReactions && reactionBatch.latestCreatedAt) {
              lastReactionPoll = reactionBatch.latestCreatedAt;
            }
            if (freshAnnouncement) lastAnnouncementId = freshAnnouncement.id;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  media: hasMedia ? media : [],
                  removed: hasRemoved ? removed : [],
                  reactions: hasReactions ? reactions : [],
                  reactionCounts: reactionCountMap,
                  announcement: freshAnnouncement,
                  panic: false,
                })}\n\n`,
              ),
            );
          } else {
            // Keep badge counts in sync even when no new create events (toggle deletes).
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  panic: false,
                  reactionCounts: reactionCountMap,
                })}\n\n`,
              ),
            );
          }
        } catch {
          controller.enqueue(encoder.encode(": error\n\n"));
        }
      };

      const event = await eventRepository.findBySlugPublic(eventSlug);
      if (!event || isEventEnded(event)) {
        if (event) await revokeGuestConnectIfEnded(event.id);
        ended = true;
        emitEnded();
      } else {
        const initialPanic = Boolean(event.mediaPanicAt);
        wasPanic = initialPanic;
        const initialMedia = initialPanic
          ? []
          : await mediaService.getAllWallMedia(eventSlug);

        // Never replay announcements on connect/refresh — only via live poll deltas.
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              media: initialMedia,
              reactions: [],
              initial: true,
              panic: initialPanic,
              ended: false,
            })}\n\n`,
          ),
        );
        lastMediaPoll = new Date();
        lastReactionPoll = new Date();
      }

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
