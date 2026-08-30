import { NextResponse } from "next/server";

export interface ApiErrorBody {
  message: string;
  code: string;
  details?: unknown;
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiError(
  message: string,
  code: string,
  status = 400,
  details?: unknown,
) {
  const error: ApiErrorBody = { message, code };
  if (details !== undefined) {
    error.details = details;
  }
  return NextResponse.json({ error }, { status });
}

export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim();
  }
  return request.headers.get("x-real-ip") ?? undefined;
}

export function handleServiceError(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "statusCode" in error &&
    "code" in error &&
    "message" in error
  ) {
    const serviceError = error as {
      message: string;
      statusCode: number;
      code: string;
    };
    return apiError(
      serviceError.message,
      serviceError.code,
      serviceError.statusCode,
    );
  }

  if (error instanceof Error && error.name === "PlanLimitError") {
    return apiError(error.message, "PLAN_LIMIT_EXCEEDED", 403);
  }

  console.error(error);
  return apiError("Internal server error", "INTERNAL_ERROR", 500);
}
