import { z } from "zod";

import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { authService } from "@/server/services/auth.service";

const verifyEmailQuerySchema = z.object({
  token: z.string().min(1),
});

const verifyEmailBodySchema = z.object({
  token: z.string().min(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = verifyEmailQuerySchema.safeParse({
    token: searchParams.get("token"),
  });

  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const result = await authService.verifyEmail(parsed.data.token);
    return apiSuccess(result);
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = verifyEmailBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const result = await authService.verifyEmail(parsed.data.token);
    return apiSuccess(result);
  } catch (error) {
    return handleServiceError(error);
  }
}
