import type { GuestStatus, Prisma } from "@prisma/client";

export const notDeleted = {
  deletedAt: null,
} satisfies Prisma.EventWhereInput;

export function organizationScope(organizationId: string): Prisma.OrganizationWhereInput {
  return {
    id: organizationId,
    deletedAt: null,
  };
}

export function eventOrganizationScope(
  organizationId: string,
): Prisma.EventWhereInput {
  return {
    organizationId,
    deletedAt: null,
  };
}

export function eventScope(
  eventId: string,
  organizationId: string,
): Prisma.EventWhereInput {
  return {
    id: eventId,
    organizationId,
    deletedAt: null,
  };
}

export function guestEventScope(eventId: string): Prisma.GuestWhereInput {
  return {
    eventId,
    deletedAt: null,
  };
}

export function clientOrganizationScope(
  organizationId: string,
): Prisma.ClientWhereInput {
  return {
    organizationId,
    deletedAt: null,
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginationResult {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function resolvePagination(params: PaginationParams = {}): PaginationResult {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function emptyGuestStatusCounts(): Record<GuestStatus, number> {
  return {
    PENDING: 0,
    INVITED: 0,
    CONFIRMED: 0,
    DECLINED: 0,
    MAYBE: 0,
    NO_RESPONSE: 0,
  };
}
