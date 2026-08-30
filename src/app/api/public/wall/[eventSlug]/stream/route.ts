import { mediaService } from "@/server/services/media.service";

interface RouteContext {
  params: Promise<{ eventSlug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { eventSlug } = await context.params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastPoll = new Date(0);

      const poll = async () => {
        try {
          const media = await mediaService.getWallMedia(eventSlug, lastPoll);
          if (media.length > 0) {
            lastPoll = new Date();
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ media })}\n\n`),
            );
          } else {
            controller.enqueue(encoder.encode(": keepalive\n\n"));
          }
        } catch {
          controller.enqueue(encoder.encode(": error\n\n"));
        }
      };

      const initial = await mediaService.getAllWallMedia(eventSlug);
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ media: initial, initial: true })}\n\n`),
      );
      lastPoll = new Date();

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
