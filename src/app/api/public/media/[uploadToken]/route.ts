import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { mediaService } from "@/server/services/media.service";

const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

interface RouteContext {
  params: Promise<{ uploadToken: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { uploadToken } = await context.params;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const caption = formData.get("caption")?.toString();
    const uploadedBy = formData.get("uploadedBy")?.toString();
    const challengeId = formData.get("challengeId")?.toString();
    const durationRaw = formData.get("durationMs");
    const durationMs =
      durationRaw != null && String(durationRaw).trim() !== ""
        ? Number(durationRaw)
        : null;
    const thumbnailRaw = formData.get("thumbnail");
    const thumbnail = thumbnailRaw instanceof File ? thumbnailRaw : null;

    if (!(file instanceof File)) {
      return apiError("No file provided", "NO_FILE", 400);
    }

    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return apiError(
        isVideo ? "File too large (max 50MB)" : "File too large (max 10MB)",
        "FILE_TOO_LARGE",
        400,
      );
    }

    const result = await mediaService.uploadPublic(
      uploadToken,
      file,
      caption,
      uploadedBy,
      challengeId,
      durationMs,
      thumbnail,
    );

    return apiSuccess(result, 201);
  } catch (error) {
    return handleServiceError(error);
  }
}
