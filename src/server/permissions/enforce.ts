import type { OrgRole } from "@prisma/client";
import { InviteStatus } from "@prisma/client";

import { prisma } from "@/server/db";

import { can } from "./matrix";
import type { Permission } from "./types";

export class AccessError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "AccessError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface OrganizationAccessContext {
  organizationId: string;
  role: OrgRole;
}

export interface EventAccessContext extends OrganizationAccessContext {
  eventId: string;
}

function mapCollaboratorRole(role: string): OrgRole {
  if (role === "OWNER") return "OWNER";
  if (role === "VIEWER") return "VIEWER";
  if (role === "ADMIN") return "ADMIN";
  if (role === "MANAGER") return "MANAGER";
  return "EDITOR";
}

export async function enforceOrganizationAccess(
  userId: string,
  orgId: string,
  permission: Permission,
): Promise<OrganizationAccessContext> {
  const organization = await prisma.organization.findFirst({
    where: {
      id: orgId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!organization) {
    throw new AccessError("Organization not found", 404, "ORG_NOT_FOUND");
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: orgId,
        userId,
      },
    },
    select: { role: true },
  });

  if (!membership) {
    throw new AccessError("You are not a member of this organization", 403, "ORG_FORBIDDEN");
  }

  if (!can(membership.role, permission)) {
    throw new AccessError("Insufficient permissions", 403, "PERMISSION_DENIED");
  }

  return {
    organizationId: orgId,
    role: membership.role,
  };
}

export async function enforceEventAccess(
  userId: string,
  eventId: string,
  permission: Permission,
): Promise<EventAccessContext> {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      deletedAt: null,
    },
    select: {
      id: true,
      organizationId: true,
    },
  });

  if (!event) {
    throw new AccessError("Event not found", 404, "EVENT_NOT_FOUND");
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: event.organizationId,
        userId,
      },
    },
    select: { role: true },
  });

  if (membership) {
    if (!can(membership.role, permission)) {
      throw new AccessError("Insufficient permissions", 403, "PERMISSION_DENIED");
    }

    return {
      eventId: event.id,
      organizationId: event.organizationId,
      role: membership.role,
    };
  }

  const collaborator = await prisma.collaborator.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
    select: { role: true },
  });

  if (collaborator) {
    if (!can(collaborator.role, permission)) {
      throw new AccessError("Insufficient permissions", 403, "PERMISSION_DENIED");
    }

    return {
      eventId: event.id,
      organizationId: event.organizationId,
      role: collaborator.role,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  const eventCollaborator = await prisma.eventCollaborator.findFirst({
    where: {
      eventId,
      OR: [
        { userId },
        ...(user?.email
          ? [{ email: user.email.toLowerCase() }]
          : []),
      ],
    },
    select: { id: true, role: true, userId: true, status: true },
  });

  if (!eventCollaborator) {
    throw new AccessError("You do not have access to this event", 403, "EVENT_FORBIDDEN");
  }

  // Link invite to the signed-in user and grant access on first visit
  if (!eventCollaborator.userId || eventCollaborator.status !== InviteStatus.ACCEPTED) {
    await prisma.eventCollaborator.update({
      where: { id: eventCollaborator.id },
      data: {
        userId,
        status: InviteStatus.ACCEPTED,
      },
    });
  }

  const role = mapCollaboratorRole(eventCollaborator.role);

  await prisma.collaborator.upsert({
    where: {
      eventId_userId: { eventId, userId },
    },
    create: {
      eventId,
      userId,
      role,
    },
    update: { role },
  });

  if (!can(role, permission)) {
    throw new AccessError("Insufficient permissions", 403, "PERMISSION_DENIED");
  }

  return {
    eventId: event.id,
    organizationId: event.organizationId,
    role,
  };
}
