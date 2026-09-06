import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import {
  songRequestService,
  SongRequestServiceError,
} from "@/server/services/song-request.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  try {
    const results = await songRequestService.searchMusic(q);
    return apiSuccess({ results });
  } catch (error) {
    if (error instanceof SongRequestServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
