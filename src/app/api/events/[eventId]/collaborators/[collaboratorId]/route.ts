import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { AccessError, enforceEventAccess } from "@/server/permissions/enforce";

interface RouteContext {
  params: Promise<{ eventId: string; collaboratorId: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { eventId, collaboratorId } = await context.params;

  try {
    const session = await requireAuth();
    await enforceEventAccess(session.user.id, eventId, "collaborator:manage");

    const existing = await prisma.eventCollaborator.findFirst({
      where: { id: collaboratorId, eventId },
    });

    if (!existing) {
      return apiError("Collaborator not found", "NOT_FOUND", 404);
    }

    if (existing.role === "OWNER") {
      return apiError("Cannot remove the event owner", "FORBIDDEN", 403);
    }

    await prisma.$transaction(async (tx) => {
      await tx.eventCollaborator.delete({
        where: { id: collaboratorId },
      });
      if (existing.userId) {
        await tx.collaborator.deleteMany({
          where: { eventId, userId: existing.userId },
        });
      } else {
        const user = await tx.user.findUnique({
          where: { email: existing.email },
          select: { id: true },
        });
        if (user) {
          await tx.collaborator.deleteMany({
            where: { eventId, userId: user.id },
          });
        }
      }
    });

    return apiSuccess({ ok: true });
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
