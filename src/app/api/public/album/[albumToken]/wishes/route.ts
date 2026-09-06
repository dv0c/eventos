import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import {
  voiceWishService,
  VoiceWishServiceError,
} from "@/server/services/voice-wish.service";

interface RouteContext {
  params: Promise<{ albumToken: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { albumToken } = await context.params;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const uploadedBy = String(formData.get("uploadedBy") ?? "");
    const durationRaw = formData.get("durationMs");
    const durationMs = Number(durationRaw);

    if (!(file instanceof File)) {
      return apiError("Audio file is required", "VALIDATION_ERROR", 400);
    }

    const result = await voiceWishService.submitPublic(
      albumToken,
      file,
      uploadedBy,
      durationMs,
    );

    return apiSuccess(result, 201);
  } catch (error) {
    if (error instanceof VoiceWishServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
