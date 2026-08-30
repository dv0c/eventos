import { z } from "zod";

import {
  apiError,
  apiSuccess,
  getClientIp,
  handleServiceError,
} from "@/lib/api-response";
import { authService } from "@/server/services/auth.service";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  locale: z.enum(["el", "en"]).optional(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const result = await authService.registerUser(parsed.data, getClientIp(request));
    return apiSuccess(result, 201);
  } catch (error) {
    return handleServiceError(error);
  }
}
