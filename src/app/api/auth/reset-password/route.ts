import { z } from "zod";

import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { authService } from "@/server/services/auth.service";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const result = await authService.resetPassword(
      parsed.data.token,
      parsed.data.password,
    );
    return apiSuccess(result);
  } catch (error) {
    return handleServiceError(error);
  }
}
