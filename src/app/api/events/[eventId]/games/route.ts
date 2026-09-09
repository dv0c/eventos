import { Prisma } from "@prisma/client";
import { z } from "zod";

import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError, enforceEventAccess } from "@/server/permissions/enforce";
import { prisma } from "@/server/db";

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

const gameSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  presetKey: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  enabled: z.boolean().optional(),
  fields: z.unknown().optional(),
  coverImage: z.string().nullable().optional(),
});

const putSchema = z.object({
  games: z.array(gameSchema),
});

export async function GET(_request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  try {
    const session = await requireAuth();
    await enforceEventAccess(session.user.id, eventId, "event:read");

    const games = await prisma.eventGame.findMany({
      where: { eventId },
      orderBy: { sortOrder: "asc" },
    });

    return apiSuccess({ games });
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

export async function PUT(request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    await enforceEventAccess(session.user.id, eventId, "event:update");

    await prisma.$transaction(async (tx) => {
      await tx.eventGame.deleteMany({ where: { eventId } });
      if (parsed.data.games.length === 0) return;
      await tx.eventGame.createMany({
        data: parsed.data.games.map((game, index) => ({
          eventId,
          title: game.title,
          description: game.description ?? null,
          presetKey: game.presetKey ?? null,
          sortOrder: game.sortOrder ?? index,
          enabled: game.enabled ?? true,
          fields: (game.fields ?? []) as Prisma.InputJsonValue,
          coverImage: game.coverImage ?? null,
        })),
      });
    });

    const games = await prisma.eventGame.findMany({
      where: { eventId },
      orderBy: { sortOrder: "asc" },
    });

    return apiSuccess({ games });
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
