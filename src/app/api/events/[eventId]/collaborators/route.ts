import { InviteStatus } from "@prisma/client";
import { z } from "zod";

import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { AccessError, enforceEventAccess } from "@/server/permissions/enforce";
import { eventRepository } from "@/server/repositories/event.repository";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["EDITOR", "VIEWER"]).default("EDITOR"),
});

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

async function ensureOwnerRow(
  eventId: string,
  hostEmail: string | null | undefined,
  invitedBy?: string,
  hostUserId?: string,
) {
  if (!hostEmail) return;

  const email = hostEmail.toLowerCase();
  await prisma.eventCollaborator.upsert({
    where: {
      eventId_email: { eventId, email },
    },
    create: {
      eventId,
      email,
      role: "OWNER",
      status: InviteStatus.ACCEPTED,
      invitedBy: invitedBy ?? null,
      userId: hostUserId ?? null,
    },
    update: {
      role: "OWNER",
      status: InviteStatus.ACCEPTED,
      userId: hostUserId ?? undefined,
    },
  });

  if (hostUserId) {
    await prisma.collaborator.upsert({
      where: {
        eventId_userId: { eventId, userId: hostUserId },
      },
      create: {
        eventId,
        userId: hostUserId,
        role: "OWNER",
      },
      update: { role: "OWNER" },
    });
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  try {
    const session = await requireAuth();
    const access = await enforceEventAccess(session.user.id, eventId, "event:read");
    const event = await eventRepository.findById(access.organizationId, eventId);

    if (!event) {
      return apiError("Event not found", "EVENT_NOT_FOUND", 404);
    }

    await ensureOwnerRow(
      eventId,
      event.hostEmail ?? session.user.email,
      session.user.id,
      session.user.id,
    );

    const collaborators = await prisma.eventCollaborator.findMany({
      where: { eventId },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });

    return apiSuccess({ collaborators });
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

  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    await enforceEventAccess(session.user.id, eventId, "collaborator:manage");

    const email = parsed.data.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    const collaborator = await prisma.eventCollaborator.upsert({
      where: {
        eventId_email: { eventId, email },
      },
      create: {
        eventId,
        email,
        role: parsed.data.role,
        userId: existingUser?.id ?? null,
        invitedBy: session.user.id,
        status: InviteStatus.PENDING,
      },
      update: {
        role: parsed.data.role,
        userId: existingUser?.id ?? undefined,
        status: InviteStatus.PENDING,
      },
    });

    if (existingUser) {
      const full = await prisma.event.findFirst({
        where: { id: eventId },
        select: {
          name: true,
          organizationId: true,
          organization: { select: { slug: true } },
        },
      });
      if (full) {
        const {
          enqueueNotification,
          eventCollaboratorsLink,
          NotificationType,
          notificationService,
        } = await import("@/server/notifications/emit");
        enqueueNotification(() =>
          notificationService.notifyUser({
            userId: existingUser.id,
            type: NotificationType.COLLAB_INVITE,
            title: "Collaboration invite",
            body: `You're invited to collaborate on ${full.name}`,
            link: eventCollaboratorsLink(full.organization.slug, eventId),
            eventId,
            organizationId: full.organizationId,
            metadata: {
              collaboratorId: collaborator.id,
              eventId,
              role: parsed.data.role,
            },
          }),
        );
      }
    }

    return apiSuccess({ collaborator }, 201);
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
