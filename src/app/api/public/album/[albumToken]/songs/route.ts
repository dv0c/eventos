import { z } from "zod";

import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import {
  songRequestService,
  SongRequestServiceError,
} from "@/server/services/song-request.service";

interface RouteContext {
  params: Promise<{ albumToken: string }>;
}

const submitSchema = z.object({
  title: z.string().trim().min(1).max(200),
  artist: z.string().trim().min(1).max(200),
  albumArtUrl: z.string().url().optional().nullable(),
  previewUrl: z.string().url().optional().nullable(),
  itunesTrackId: z.string().optional().nullable(),
  requestedBy: z.string().trim().min(1).max(80),
  note: z.string().trim().max(200).optional().nullable(),
});

export async function GET(_request: Request, context: RouteContext) {
  const { albumToken } = await context.params;

  try {
    const data = await songRequestService.listPublicByAlbumToken(albumToken);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof SongRequestServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { albumToken } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const result = await songRequestService.submitPublic(albumToken, parsed.data);
    return apiSuccess(result, 201);
  } catch (error) {
    if (error instanceof SongRequestServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
