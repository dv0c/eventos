import { z } from "zod";

import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { authService } from "@/server/services/auth.service";

const forgotPasswordSchema = z.object({
  email: z.email(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const result = await authService.requestPasswordReset(parsed.data.email);
    return apiSuccess(result);
  } catch (error) {
    return handleServiceError(error);
  }
}
