import { NextResponse } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { getSession } from "@/server/auth/session";
import {
  AccessError,
  PanicServiceError,
  panicService,
} from "@/server/services/panic.service";

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { eventId } = await context.params;
    const data = await panicService.getState(session.user.id, eventId);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof AccessError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof PanicServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    console.error("Panic GET error:", error);
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { eventId } = await context.params;
    const data = await panicService.arm(session.user.id, eventId);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof AccessError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof PanicServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    console.error("Panic POST error:", error);
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { eventId } = await context.params;
    const data = await panicService.clear(session.user.id, eventId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AccessError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof PanicServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    console.error("Panic DELETE error:", error);
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
