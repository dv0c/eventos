import { NextResponse } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { AuthError, getActiveOrganizationId, requireAuth } from "@/server/auth/session";
import { getStorageProvider } from "@/server/providers/storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const organizationId = await getActiveOrganizationId();

    if (!organizationId) {
      return apiError("No active organization selected", "NO_ACTIVE_ORG", 400);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder")?.toString() ?? "uploads";

    if (!(file instanceof File)) {
      return apiError("No file provided", "NO_FILE", 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError("Invalid file type", "INVALID_FILE_TYPE", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError("File too large (max 5MB)", "FILE_TOO_LARGE", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() ?? "jpg";
    const key = `${folder}/${organizationId}/${session.user.id}/${Date.now()}.${ext}`;

    const storage = getStorageProvider();
    await storage.upload(key, buffer, { contentType: file.type });

    return apiSuccess({
      key,
      url: storage.getPublicUrl(key),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    console.error("Upload error:", error);
    return apiError("Upload failed", "UPLOAD_FAILED", 500);
  }
}
