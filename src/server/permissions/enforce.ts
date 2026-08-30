import type { OrgRole } from "@prisma/client";

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

  if (!collaborator) {
    throw new AccessError("You do not have access to this event", 403, "EVENT_FORBIDDEN");
  }

  if (!can(collaborator.role, permission)) {
    throw new AccessError("Insufficient permissions", 403, "PERMISSION_DENIED");
  }

  return {
    eventId: event.id,
    organizationId: event.organizationId,
    role: collaborator.role,
  };
}
