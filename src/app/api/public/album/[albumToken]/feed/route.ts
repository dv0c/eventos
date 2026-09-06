import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { mediaService, MediaServiceError } from "@/server/services/media.service";

interface RouteContext {
  params: Promise<{ albumToken: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { albumToken } = await context.params;

  try {
    const feed = await mediaService.getAlbumFeed(albumToken);
    const response = apiSuccess(feed);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof MediaServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
