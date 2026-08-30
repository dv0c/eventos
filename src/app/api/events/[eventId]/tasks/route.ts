import { TaskPriority, TaskStatus } from "@prisma/client";
import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import { taskService } from "@/server/services/task.service";

const createTaskSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
});

const listQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  search: z.string().optional(),
});

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { eventId } = await context.params;
  const { searchParams } = new URL(request.url);
  const parsed = listQuerySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const result = await taskService.listTasks(session.user.id, eventId, parsed.data);
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

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const task = await taskService.createTask(
      session.user.id,
      eventId,
      parsed.data,
      getClientIp(request),
    );
    return apiSuccess({ task }, 201);
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
