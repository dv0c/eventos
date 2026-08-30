import {
  AuditAction,
  GuestStatus,
  TableShape,
  type Prisma,
  type Table,
} from "@prisma/client";

import { prisma } from "@/server/db";
import { enforceEventAccess } from "@/server/permissions/enforce";

import { auditService } from "./audit.service";

export class SeatingServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "SeatingServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface CreateTableInput {
  name: string;
  shape?: TableShape;
  capacity?: number;
  positionX?: number;
  positionY?: number;
  sortOrder?: number;
}

export interface UpdateTableInput extends Partial<CreateTableInput> {}

export interface AssignGuestInput {
  guestId: string;
  tableId: string;
  seatId?: string | null;
}

export interface SeatingSuggestion {
  guestId: string;
  tableId: string;
  reason: string;
}

const tableInclude = {
  assignments: {
    include: {
      guest: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          partySize: true,
          isVip: true,
          family: true,
          status: true,
        },
      },
      seat: true,
    },
  },
  seats: {
    orderBy: { seatNumber: "asc" as const },
  },
} satisfies Prisma.TableInclude;

async function getTableUsedCapacity(tableId: string, excludeGuestId?: string): Promise<number> {
  const assignments = await prisma.seatingAssignment.findMany({
    where: {
      tableId,
      ...(excludeGuestId ? { guestId: { not: excludeGuestId } } : {}),
    },
    include: {
      guest: { select: { partySize: true } },
    },
  });

  return assignments.reduce((sum, assignment) => sum + assignment.guest.partySize, 0);
}

async function ensureTableBelongsToEvent(eventId: string, tableId: string) {
  const table = await prisma.table.findFirst({
    where: { id: tableId, eventId },
  });

  if (!table) {
    throw new SeatingServiceError("Table not found", 404, "TABLE_NOT_FOUND");
  }

  return table;
}

async function ensureGuestBelongsToEvent(eventId: string, guestId: string) {
  const guest = await prisma.guest.findFirst({
    where: { id: guestId, eventId, deletedAt: null },
  });

  if (!guest) {
    throw new SeatingServiceError("Guest not found", 404, "GUEST_NOT_FOUND");
  }

  return guest;
}

export const seatingService = {
  async getSeating(userId: string, eventId: string) {
    await enforceEventAccess(userId, eventId, "guest:read");

    const [tables, guests] = await Promise.all([
      prisma.table.findMany({
        where: { eventId },
        include: tableInclude,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.guest.findMany({
        where: { eventId, deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          partySize: true,
          isVip: true,
          family: true,
          status: true,
          tableId: true,
          seatingAssignments: {
            select: {
              id: true,
              tableId: true,
              seatId: true,
              guestId: true,
            },
          },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
    ]);

    const unassignedGuests = guests.filter(
      (guest) => guest.seatingAssignments.length === 0,
    );

    const stats = {
      totalTables: tables.length,
      totalCapacity: tables.reduce((sum, table) => sum + table.capacity, 0),
      assignedGuests: guests.length - unassignedGuests.length,
      unassignedGuests: unassignedGuests.length,
    };

    return { tables, guests, unassignedGuests, stats };
  },

  async createTable(
    userId: string,
    eventId: string,
    input: CreateTableInput,
    ipAddress?: string,
  ): Promise<Table> {
    const access = await enforceEventAccess(userId, eventId, "guest:update");

    const maxSort = await prisma.table.aggregate({
      where: { eventId },
      _max: { sortOrder: true },
    });

    const capacity = input.capacity ?? 10;

    const table = await prisma.table.create({
      data: {
        eventId,
        name: input.name.trim(),
        shape: input.shape ?? TableShape.ROUND,
        capacity,
        positionX: input.positionX ?? 0,
        positionY: input.positionY ?? 0,
        sortOrder: input.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
        seats: {
          create: Array.from({ length: capacity }, (_, index) => ({
            seatNumber: index + 1,
          })),
        },
      },
      include: tableInclude,
    });

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.TABLE_CREATED,
      entity: "Table",
      entityId: table.id,
      metadata: { name: table.name, capacity: table.capacity },
      ipAddress,
    });

    return table;
  },

  async updateTable(
    userId: string,
    eventId: string,
    tableId: string,
    input: UpdateTableInput,
    ipAddress?: string,
  ) {
    const access = await enforceEventAccess(userId, eventId, "guest:update");
    const existing = await ensureTableBelongsToEvent(eventId, tableId);

    if (input.capacity !== undefined && input.capacity < existing.capacity) {
      const used = await getTableUsedCapacity(tableId);
      if (used > input.capacity) {
        throw new SeatingServiceError(
          "Cannot reduce capacity below current assignments",
          400,
          "TABLE_CAPACITY_EXCEEDED",
        );
      }
    }

    const data: Prisma.TableUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.shape !== undefined) data.shape = input.shape;
    if (input.capacity !== undefined) data.capacity = input.capacity;
    if (input.positionX !== undefined) data.positionX = input.positionX;
    if (input.positionY !== undefined) data.positionY = input.positionY;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

    const table = await prisma.$transaction(async (tx) => {
      const updated = await tx.table.update({
        where: { id: tableId },
        data,
        include: tableInclude,
      });

      if (input.capacity !== undefined && input.capacity !== existing.capacity) {
        const currentSeats = await tx.seat.count({ where: { tableId } });

        if (input.capacity > currentSeats) {
          await tx.seat.createMany({
            data: Array.from({ length: input.capacity - currentSeats }, (_, index) => ({
              tableId,
              seatNumber: currentSeats + index + 1,
            })),
          });
        } else if (input.capacity < currentSeats) {
          await tx.seat.deleteMany({
            where: {
              tableId,
              seatNumber: { gt: input.capacity },
            },
          });
        }
      }

      return updated;
    });

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.SEATING_CHANGED,
      entity: "Table",
      entityId: tableId,
      metadata: input as Prisma.InputJsonValue,
      ipAddress,
    });

    return table;
  },

  async deleteTable(
    userId: string,
    eventId: string,
    tableId: string,
    ipAddress?: string,
  ): Promise<void> {
    const access = await enforceEventAccess(userId, eventId, "guest:update");
    await ensureTableBelongsToEvent(eventId, tableId);

    await prisma.$transaction(async (tx) => {
      await tx.guest.updateMany({
        where: { tableId },
        data: { tableId: null },
      });
      await tx.table.delete({ where: { id: tableId } });
    });

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.SEATING_CHANGED,
      entity: "Table",
      entityId: tableId,
      metadata: { deleted: true },
      ipAddress,
    });
  },

  async assignGuest(
    userId: string,
    eventId: string,
    input: AssignGuestInput,
    ipAddress?: string,
  ) {
    const access = await enforceEventAccess(userId, eventId, "guest:update");

    const [table, guest] = await Promise.all([
      ensureTableBelongsToEvent(eventId, input.tableId),
      ensureGuestBelongsToEvent(eventId, input.guestId),
    ]);

    const usedCapacity = await getTableUsedCapacity(input.tableId, input.guestId);
    if (usedCapacity + guest.partySize > table.capacity) {
      throw new SeatingServiceError(
        "Table does not have enough capacity",
        400,
        "TABLE_CAPACITY_EXCEEDED",
      );
    }

    if (input.seatId) {
      const seat = await prisma.seat.findFirst({
        where: { id: input.seatId, tableId: input.tableId },
      });
      if (!seat) {
        throw new SeatingServiceError("Seat not found", 404, "SEAT_NOT_FOUND");
      }

      const seatTaken = await prisma.seatingAssignment.findFirst({
        where: {
          seatId: input.seatId,
          guestId: { not: input.guestId },
        },
      });
      if (seatTaken) {
        throw new SeatingServiceError("Seat is already assigned", 400, "SEAT_TAKEN");
      }
    }

    const assignment = await prisma.$transaction(async (tx) => {
      await tx.seatingAssignment.deleteMany({
        where: { guestId: input.guestId },
      });

      const created = await tx.seatingAssignment.create({
        data: {
          tableId: input.tableId,
          guestId: input.guestId,
          seatId: input.seatId ?? null,
        },
        include: {
          guest: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              partySize: true,
            },
          },
          table: { select: { id: true, name: true } },
          seat: true,
        },
      });

      await tx.guest.update({
        where: { id: input.guestId },
        data: { tableId: input.tableId },
      });

      return created;
    });

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.SEATING_CHANGED,
      entity: "SeatingAssignment",
      entityId: assignment.id,
      metadata: {
        guestId: input.guestId,
        tableId: input.tableId,
        seatId: input.seatId ?? null,
      },
      ipAddress,
    });

    return assignment;
  },

  async unassignGuest(
    userId: string,
    eventId: string,
    guestId: string,
    ipAddress?: string,
  ): Promise<void> {
    const access = await enforceEventAccess(userId, eventId, "guest:update");
    await ensureGuestBelongsToEvent(eventId, guestId);

    const existing = await prisma.seatingAssignment.findUnique({
      where: { guestId },
    });

    if (!existing) {
      throw new SeatingServiceError("Guest is not assigned to a table", 404, "NOT_ASSIGNED");
    }

    await prisma.$transaction(async (tx) => {
      await tx.seatingAssignment.delete({ where: { guestId } });
      await tx.guest.update({
        where: { id: guestId },
        data: { tableId: null },
      });
    });

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.SEATING_CHANGED,
      entity: "SeatingAssignment",
      entityId: existing.id,
      metadata: { guestId, unassigned: true },
      ipAddress,
    });
  },

  async suggestSeating(userId: string, eventId: string) {
    await enforceEventAccess(userId, eventId, "guest:read");

    const [tables, unassignedGuests] = await Promise.all([
      prisma.table.findMany({
        where: { eventId },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.guest.findMany({
        where: {
          eventId,
          deletedAt: null,
          status: { in: [GuestStatus.CONFIRMED, GuestStatus.INVITED, GuestStatus.MAYBE] },
          seatingAssignments: { none: {} },
        },
        orderBy: [{ isVip: "desc" }, { family: "asc" }, { lastName: "asc" }],
      }),
    ]);

    const tableAvailability = await Promise.all(
      tables.map(async (table) => ({
        table,
        used: await getTableUsedCapacity(table.id),
      })),
    );

    const suggestions: SeatingSuggestion[] = [];
    const assignedInSuggestion = new Set<string>();

    const familyGroups = new Map<string, typeof unassignedGuests>();
    for (const guest of unassignedGuests) {
      const key = guest.family?.trim() || guest.id;
      const group = familyGroups.get(key) ?? [];
      group.push(guest);
      familyGroups.set(key, group);
    }

    const sortedGroups = [...familyGroups.values()].sort((a, b) => {
      const aVip = a.some((g) => g.isVip) ? 1 : 0;
      const bVip = b.some((g) => g.isVip) ? 1 : 0;
      if (aVip !== bVip) return bVip - aVip;
      const aSize = a.reduce((sum, g) => sum + g.partySize, 0);
      const bSize = b.reduce((sum, g) => sum + g.partySize, 0);
      return bSize - aSize;
    });

    for (const group of sortedGroups) {
      const groupPartySize = group.reduce((sum, guest) => sum + guest.partySize, 0);
      const isVipGroup = group.some((guest) => guest.isVip);
      const hasFamily = group.length > 1 && group[0]?.family;

      const candidateTables = [...tableAvailability].sort((a, b) => {
        if (isVipGroup) {
          const aVip = a.table.shape === TableShape.VIP ? 0 : 1;
          const bVip = b.table.shape === TableShape.VIP ? 0 : 1;
          if (aVip !== bVip) return aVip - bVip;
        }
        const aRemaining = a.table.capacity - a.used;
        const bRemaining = b.table.capacity - b.used;
        if (hasFamily) {
          const aFits = aRemaining >= groupPartySize ? 0 : 1;
          const bFits = bRemaining >= groupPartySize ? 0 : 1;
          if (aFits !== bFits) return aFits - bFits;
        }
        return bRemaining - aRemaining;
      });

      for (const guest of group) {
        if (assignedInSuggestion.has(guest.id)) continue;

        let placed = false;
        for (const slot of candidateTables) {
          const remaining = slot.table.capacity - slot.used;
          if (remaining >= guest.partySize) {
            suggestions.push({
              guestId: guest.id,
              tableId: slot.table.id,
              reason: hasFamily
                ? isVipGroup
                  ? "vip_family_group"
                  : "family_group"
                : isVipGroup
                  ? "vip_guest"
                  : "available_capacity",
            });
            slot.used += guest.partySize;
            assignedInSuggestion.add(guest.id);
            placed = true;
            break;
          }
        }

        if (!placed) {
          suggestions.push({
            guestId: guest.id,
            tableId: "",
            reason: "no_capacity",
          });
        }
      }
    }

    const unassigned = unassignedGuests.filter(
      (guest) => !assignedInSuggestion.has(guest.id),
    );

    return { suggestions, unassigned };
  },
};
