import {
  AuditAction,
  GuestStatus,
  type Guest,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/server/db";
import { enforceEventAccess } from "@/server/permissions/enforce";
import { guestRepository } from "@/server/repositories/guest.repository";

import { auditService } from "./audit.service";
import { planLimitsService } from "./plan-limits.service";

export class GuestServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "GuestServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface CreateGuestInput {
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
  tagIds?: string[];
}

export interface UpdateGuestInput extends Partial<CreateGuestInput> {}

export interface ListGuestsInput {
  status?: GuestStatus;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "lastName" | "status";
  sortOrder?: "asc" | "desc";
}

export const guestService = {
  async listGuests(
    userId: string,
    eventId: string,
    options: ListGuestsInput = {},
  ) {
    await enforceEventAccess(userId, eventId, "guest:read");
    return guestRepository.listByEvent(eventId, options);
  },

  async getGuest(userId: string, eventId: string, guestId: string) {
    await enforceEventAccess(userId, eventId, "guest:read");
    const guest = await guestRepository.findById(eventId, guestId);
    if (!guest) {
      throw new GuestServiceError("Guest not found", 404, "GUEST_NOT_FOUND");
    }
    return guest;
  },

  async createGuest(
    userId: string,
    eventId: string,
    input: CreateGuestInput,
    ipAddress?: string,
  ): Promise<Guest> {
    const access = await enforceEventAccess(userId, eventId, "guest:create");
    await planLimitsService.assertWithinLimit(access.organizationId, "guests");

    const guest = await guestRepository.create(eventId, {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      family: input.family?.trim() || null,
      plusOne: input.plusOne ?? false,
      plusOneName: input.plusOneName?.trim() || null,
      children: input.children ?? 0,
      partySize: input.partySize ?? 1,
      status: input.status ?? GuestStatus.PENDING,
      dietaryRequirements: input.dietaryRequirements ?? null,
      notes: input.notes ?? null,
      isVip: input.isVip ?? false,
      groupId: input.groupId ?? null,
    });

    if (input.tagIds?.length) {
      await guestRepository.setTags(guest.id, input.tagIds);
    }

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.GUEST_CREATED,
      entity: "Guest",
      entityId: guest.id,
      ipAddress,
    });

    return guest;
  },

  async updateGuest(
    userId: string,
    eventId: string,
    guestId: string,
    input: UpdateGuestInput,
    ipAddress?: string,
  ): Promise<Guest> {
    const access = await enforceEventAccess(userId, eventId, "guest:update");

    const existing = await guestRepository.findById(eventId, guestId);
    if (!existing) {
      throw new GuestServiceError("Guest not found", 404, "GUEST_NOT_FOUND");
    }

    const data: Prisma.GuestUpdateInput = {};
    if (input.firstName !== undefined) data.firstName = input.firstName.trim();
    if (input.lastName !== undefined) data.lastName = input.lastName.trim();
    if (input.email !== undefined) data.email = input.email?.trim() || null;
    if (input.phone !== undefined) data.phone = input.phone?.trim() || null;
    if (input.family !== undefined) data.family = input.family?.trim() || null;
    if (input.plusOne !== undefined) data.plusOne = input.plusOne;
    if (input.plusOneName !== undefined) data.plusOneName = input.plusOneName?.trim() || null;
    if (input.children !== undefined) data.children = input.children;
    if (input.partySize !== undefined) data.partySize = input.partySize;
    if (input.status !== undefined) data.status = input.status;
    if (input.dietaryRequirements !== undefined) data.dietaryRequirements = input.dietaryRequirements;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.isVip !== undefined) data.isVip = input.isVip;
    if (input.groupId !== undefined) {
      data.group = input.groupId
        ? { connect: { id: input.groupId } }
        : { disconnect: true };
    }

    const guest = await guestRepository.update(eventId, guestId, data);

    if (input.tagIds !== undefined) {
      await guestRepository.setTags(guestId, input.tagIds);
    }

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.GUEST_UPDATED,
      entity: "Guest",
      entityId: guestId,
      metadata: input as Prisma.InputJsonValue,
      ipAddress,
    });

    return guest;
  },

  async deleteGuest(
    userId: string,
    eventId: string,
    guestId: string,
    ipAddress?: string,
  ): Promise<void> {
    const access = await enforceEventAccess(userId, eventId, "guest:delete");

    const existing = await guestRepository.findById(eventId, guestId);
    if (!existing) {
      throw new GuestServiceError("Guest not found", 404, "GUEST_NOT_FOUND");
    }

    await guestRepository.softDelete(eventId, guestId);

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.GUEST_DELETED,
      entity: "Guest",
      entityId: guestId,
      ipAddress,
    });
  },

  async bulkDeleteGuests(
    userId: string,
    eventId: string,
    guestIds: string[],
    ipAddress?: string,
  ): Promise<number> {
    const access = await enforceEventAccess(userId, eventId, "guest:delete");
    const count = await guestRepository.bulkSoftDelete(eventId, guestIds);

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.GUEST_DELETED,
      entity: "Guest",
      metadata: { guestIds, count },
      ipAddress,
    });

    return count;
  },

  async mergeGuests(
    userId: string,
    eventId: string,
    primaryGuestId: string,
    duplicateGuestId: string,
    ipAddress?: string,
  ): Promise<Guest> {
    const access = await enforceEventAccess(userId, eventId, "guest:update");
    const merged = await guestRepository.merge(eventId, primaryGuestId, duplicateGuestId);

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.GUEST_UPDATED,
      entity: "Guest",
      entityId: primaryGuestId,
      metadata: { mergedFrom: duplicateGuestId },
      ipAddress,
    });

    return merged;
  },

  async getRsvpStats(userId: string, eventId: string) {
    await enforceEventAccess(userId, eventId, "guest:read");
    return guestRepository.countByStatus(eventId);
  },
};
