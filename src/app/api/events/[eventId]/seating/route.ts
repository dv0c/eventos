import { TableShape } from "@prisma/client";
import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import { seatingService } from "@/server/services/seating.service";

const createTableSchema = z.object({
  name: z.string().trim().min(1),
  shape: z.nativeEnum(TableShape).optional(),
  capacity: z.number().int().min(1).max(50).optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  sortOrder: z.number().int().optional(),
});

const updateTableSchema = z
  .object({
    tableId: z.string().min(1),
    name: z.string().trim().min(1).optional(),
    shape: z.nativeEnum(TableShape).optional(),
    capacity: z.number().int().min(1).max(50).optional(),
    positionX: z.number().optional(),
    positionY: z.number().optional(),
    sortOrder: z.number().int().optional(),
  })
  .refine((data) => Object.keys(data).length > 1, {
    message: "At least one field must be provided",
  });

const deleteTableSchema = z.object({
  tableId: z.string().min(1),
});

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  try {
    const session = await requireAuth();
    const result = await seatingService.getSeating(session.user.id, eventId);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof AccessError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = createTableSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const table = await seatingService.createTable(
      session.user.id,
      eventId,
      parsed.data,
      getClientIp(request),
    );
    return apiSuccess({ table }, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof AccessError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = updateTableSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  const { tableId, ...input } = parsed.data;

  try {
    const session = await requireAuth();
    const table = await seatingService.updateTable(
      session.user.id,
      eventId,
      tableId,
      input,
      getClientIp(request),
    );
    return apiSuccess({ table });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof AccessError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = deleteTableSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    await seatingService.deleteTable(
      session.user.id,
      eventId,
      parsed.data.tableId,
      getClientIp(request),
    );
    return apiSuccess({ deleted: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof AccessError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
