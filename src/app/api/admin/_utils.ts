import { NextResponse } from "next/server";

import { apiError, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAdmin } from "@/server/auth/session";
import { AdminServiceError } from "@/server/services/admin.service";

export async function withAdmin<T>(
  handler: (adminId: string) => Promise<T>,
): Promise<NextResponse> {
  try {
    const session = await requireAdmin();
    const data = await handler(session.user.id);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof AdminServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
