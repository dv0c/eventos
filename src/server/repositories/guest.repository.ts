import { type Guest, GuestStatus, type Prisma } from "@prisma/client";

import { prisma } from "@/server/db";

import { guestEventScope, emptyGuestStatusCounts, resolvePagination, type PaginationParams } from "./base";

export interface CreateGuestData {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  family?: string | null;
  plusOne?: boolean;
  plusOneName?: string | null;
  children?: number;
  partySize?: number;
  status?: GuestStatus;
  dietaryRequirements?: string | null;
  notes?: string | null;
  isVip?: boolean;
  groupId?: string | null;
}

export interface ListGuestsOptions extends PaginationParams {
  status?: GuestStatus;
  search?: string;
  sortBy?: "createdAt" | "lastName" | "status";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedGuests {
  guests: Guest[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const guestRepository = {
  async listByEvent(
    eventId: string,
    options: ListGuestsOptions = {},
  ): Promise<PaginatedGuests> {
    const { page, pageSize, skip, take } = resolvePagination(options);

    const where: Prisma.GuestWhereInput = {
      ...guestEventScope(eventId),
      ...(options.status ? { status: options.status } : {}),
      ...(options.search
        ? {
            OR: [
              { firstName: { contains: options.search, mode: "insensitive" } },
              { lastName: { contains: options.search, mode: "insensitive" } },
              { email: { contains: options.search, mode: "insensitive" } },
              { phone: { contains: options.search, mode: "insensitive" } },
              { family: { contains: options.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const sortBy = options.sortBy ?? "createdAt";
    const sortOrder = options.sortOrder ?? "desc";

    const orderBy: Prisma.GuestOrderByWithRelationInput[] =
      sortBy === "lastName"
        ? [{ lastName: sortOrder }, { firstName: sortOrder }]
        : [{ [sortBy]: sortOrder }];

    const [guests, total] = await prisma.$transaction([
      prisma.guest.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      prisma.guest.count({ where }),
    ]);

    return {
      guests,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async countByStatus(eventId: string): Promise<Record<GuestStatus, number>> {
    const rows = await prisma.guest.groupBy({
      by: ["status"],
      where: guestEventScope(eventId),
      _count: { _all: true },
    });

    const counts = emptyGuestStatusCounts();

    for (const row of rows) {
      counts[row.status] = row._count._all;
    }

    return counts;
  },

  async findById(eventId: string, guestId: string): Promise<Guest | null> {
    return prisma.guest.findFirst({
      where: {
        id: guestId,
        ...guestEventScope(eventId),
      },
    });
  },

  async create(eventId: string, data: CreateGuestData): Promise<Guest> {
    return prisma.guest.create({
      data: {
        eventId,
        ...data,
      },
    });
  },

  async update(
    eventId: string,
    guestId: string,
    data: Prisma.GuestUpdateInput,
  ): Promise<Guest> {
    await prisma.guest.updateMany({
      where: { id: guestId, ...guestEventScope(eventId) },
      data,
    });
    const guest = await this.findById(eventId, guestId);
    if (!guest) {
      throw new Error("Guest not found after update");
    }
    return guest;
  },

  async softDelete(eventId: string, guestId: string): Promise<void> {
    await prisma.guest.updateMany({
      where: { id: guestId, ...guestEventScope(eventId) },
      data: { deletedAt: new Date() },
    });
  },

  async bulkSoftDelete(eventId: string, guestIds: string[]): Promise<number> {
    const result = await prisma.guest.updateMany({
      where: {
        id: { in: guestIds },
        ...guestEventScope(eventId),
      },
      data: { deletedAt: new Date() },
    });
    return result.count;
  },

  async setTags(guestId: string, tagIds: string[]): Promise<void> {
    await prisma.$transaction([
      prisma.guestTagAssignment.deleteMany({ where: { guestId } }),
      ...(tagIds.length
        ? [
            prisma.guestTagAssignment.createMany({
              data: tagIds.map((tagId) => ({ guestId, tagId })),
            }),
          ]
        : []),
    ]);
  },

  async merge(
    eventId: string,
    primaryGuestId: string,
    duplicateGuestId: string,
  ): Promise<Guest> {
    const [primary, duplicate] = await Promise.all([
      this.findById(eventId, primaryGuestId),
      this.findById(eventId, duplicateGuestId),
    ]);

    if (!primary || !duplicate) {
      throw new Error("Guest not found for merge");
    }

    await prisma.$transaction(async (tx) => {
      await tx.invitation.updateMany({
        where: { guestId: duplicateGuestId },
        data: { guestId: primaryGuestId },
      });
      await tx.rsvpResponse.updateMany({
        where: { guestId: duplicateGuestId },
        data: { guestId: primaryGuestId },
      });
      await tx.seatingAssignment.updateMany({
        where: { guestId: duplicateGuestId },
        data: { guestId: primaryGuestId },
      });
      await tx.guest.update({
        where: { id: primaryGuestId },
        data: {
          email: primary.email ?? duplicate.email,
          phone: primary.phone ?? duplicate.phone,
          partySize: Math.max(primary.partySize, duplicate.partySize),
          notes: [primary.notes, duplicate.notes].filter(Boolean).join("\n") || null,
        },
      });
      await tx.guest.update({
        where: { id: duplicateGuestId },
        data: { deletedAt: new Date() },
      });
    });

    const merged = await this.findById(eventId, primaryGuestId);
    if (!merged) {
      throw new Error("Merged guest not found");
    }
    return merged;
  },

  async findDuplicates(
    eventId: string,
    email?: string | null,
    phone?: string | null,
  ): Promise<Guest[]> {
    if (!email && !phone) return [];

    const or: Prisma.GuestWhereInput[] = [];
    if (email) or.push({ email: { equals: email, mode: "insensitive" } });
    if (phone) or.push({ phone });

    return prisma.guest.findMany({
      where: {
        ...guestEventScope(eventId),
        OR: or,
      },
    });
  },
};
