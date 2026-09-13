import { apiError, apiSuccess } from "@/lib/api-response";
import { getSession } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import {
  EventRunServiceError,
  eventRunService,
  type EventRunAction,
} from "@/server/services/event-run.service";

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

const ACTIONS = new Set<EventRunAction>(["start", "pause", "resume", "stop"]);

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }
    const { eventId } = await context.params;
    const data = await eventRunService.getSnapshot(session.user.id, eventId);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof AccessError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof EventRunServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    console.error("Event run GET error:", error);
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }
    const { eventId } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      action?: string;
    } | null;
    const action = body?.action;
    if (!action || !ACTIONS.has(action as EventRunAction)) {
      return apiError("Invalid action", "INVALID_ACTION", 400);
    }
    const data = await eventRunService.runAction(
      session.user.id,
      eventId,
      action as EventRunAction,
    );
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof AccessError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof EventRunServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    console.error("Event run POST error:", error);
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
