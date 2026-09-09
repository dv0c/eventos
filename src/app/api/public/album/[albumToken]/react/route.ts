import { z } from "zod";

import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { getRateLimitKey, rateLimit } from "@/lib/rate-limit";
import { WALL_REACTION_EMOJIS } from "@/lib/wall-reactions";
import { mediaService, MediaServiceError } from "@/server/services/media.service";

interface RouteContext {
  params: Promise<{ albumToken: string }>;
}

const reactSchema = z.object({
  mediaId: z.string().min(1),
  emoji: z.enum(WALL_REACTION_EMOJIS),
  reactorKey: z.string().min(8).max(128),
});

export async function POST(request: Request, context: RouteContext) {
  const { albumToken } = await context.params;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const limited = await rateLimit(
    getRateLimitKey("album-react", `${albumToken}:${ip}`),
    30,
    60_000,
  );

  if (!limited.success) {
    return apiError("Too many requests", "RATE_LIMITED", 429);
  }

  try {
    const body = await request.json();
    const parsed = reactSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid reaction", "VALIDATION_ERROR", 400);
    }

    const reaction = await mediaService.addAlbumReaction(
      albumToken,
      parsed.data.mediaId,
      parsed.data.emoji,
      parsed.data.reactorKey,
    );

    return apiSuccess(reaction, reaction && "removed" in reaction && reaction.removed ? 200 : 201);
  } catch (error) {
    if (error instanceof MediaServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
