import { TaskPriority, TaskStatus } from "@prisma/client";
import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import { taskService } from "@/server/services/task.service";

const updateTaskSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.string().optional().nullable(),
    assigneeId: z.string().optional().nullable(),
    dueDate: z.coerce.date().optional().nullable(),
    priority: z.nativeEnum(TaskPriority).optional(),
    status: z.nativeEnum(TaskStatus).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

interface RouteContext {
  params: Promise<{ eventId: string; taskId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { eventId, taskId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const task = await taskService.updateTask(
      session.user.id,
      eventId,
      taskId,
      parsed.data,
      getClientIp(request),
    );
    return apiSuccess({ task });
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

export async function DELETE(_request: Request, context: RouteContext) {
  const { eventId, taskId } = await context.params;

  try {
    const session = await requireAuth();
    await taskService.deleteTask(
      session.user.id,
      eventId,
      taskId,
      getClientIp(_request),
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
