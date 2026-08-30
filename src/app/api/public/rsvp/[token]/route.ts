import { RsvpStatus } from "@prisma/client";
import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { rsvpService } from "@/server/services/rsvp.service";

const submitSchema = z.object({
  status: z.nativeEnum(RsvpStatus),
  partySize: z.number().int().min(1).optional(),
  children: z.number().int().min(0).optional(),
  dietary: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  plusOneName: z.string().optional().nullable(),
});

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;

  try {
    const data = await rsvpService.getByToken(token);
    return apiSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;

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
    const data = await rsvpService.submitRsvp(
      token,
      parsed.data,
      getClientIp(request),
    );
    return apiSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
}
