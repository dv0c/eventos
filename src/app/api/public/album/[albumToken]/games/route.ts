import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { prisma } from "@/server/db";
import { mediaService, MediaServiceError } from "@/server/services/media.service";

interface RouteContext {
  params: Promise<{ albumToken: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { albumToken } = await context.params;

  try {
    const access = await mediaService.getAlbumAccessByToken(albumToken);
    const games = await prisma.eventGame.findMany({
      where: { eventId: access.eventId, enabled: true },
      orderBy: { sortOrder: "asc" },
    });

    return apiSuccess({
      games: games.map((game) => ({
        id: game.id,
        title: game.title,
        description: game.description,
        presetKey: game.presetKey,
        mode: game.mode === "collage" || game.presetKey === "collage" ? "collage" : "photo",
        coverImage: game.coverImage,
        fields: game.fields,
      })),
    });
  } catch (error) {
    if (error instanceof MediaServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
