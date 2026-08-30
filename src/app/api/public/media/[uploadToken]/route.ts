import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { mediaService } from "@/server/services/media.service";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

    if (!(file instanceof File)) {
      return apiError("No file provided", "NO_FILE", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError("File too large (max 10MB)", "FILE_TOO_LARGE", 400);
    }

    const result = await mediaService.uploadPublic(
      uploadToken,
      file,
      caption,
      uploadedBy,
    );

    return apiSuccess(result, 201);
  } catch (error) {
    return handleServiceError(error);
  }
}
