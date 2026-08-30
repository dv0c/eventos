import { AuditAction, GuestStatus, RsvpStatus } from "@prisma/client";

import { prisma } from "@/server/db";

import { auditService } from "./audit.service";

export class RsvpServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "RsvpServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface RsvpContext {
  event: {
    id: string;
    name: string;
    slug: string;
    date: Date;
    location: string | null;
    hostName: string | null;
    settings: {
      allowRsvp: boolean;
      allowPlusOnes: boolean;
      allowChildren: boolean;
      allowMaybe: boolean;
      rsvpDeadline: Date | null;
    } | null;
    theme: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
    } | null;
  };
  guest: {
    id: string;
    firstName: string;
    lastName: string;
    status: GuestStatus;
    partySize: number;
    children: number;
    plusOne: boolean;
    plusOneName: string | null;
    dietaryRequirements: string | null;
  };
  token: string;
}

export interface SubmitRsvpInput {
  status: RsvpStatus;
  partySize?: number;
  children?: number;
  dietary?: string | null;
  message?: string | null;
  plusOneName?: string | null;
}

function mapRsvpToGuestStatus(status: RsvpStatus): GuestStatus {
  switch (status) {
    case RsvpStatus.YES:
      return GuestStatus.CONFIRMED;
    case RsvpStatus.NO:
      return GuestStatus.DECLINED;
    case RsvpStatus.MAYBE:
      return GuestStatus.MAYBE;
    default:
      return GuestStatus.PENDING;
  }
}

export const rsvpService = {
  async getByToken(token: string): Promise<RsvpContext> {
    const invitation = await prisma.invitation.findUnique({
      where: { rsvpToken: token },
      include: {
        guest: true,
        event: {
          include: {
            settings: true,
            theme: true,
          },
        },
      },
    });

    if (!invitation || invitation.event.deletedAt) {
      throw new RsvpServiceError("Invalid RSVP link", 404, "RSVP_NOT_FOUND");
    }

    if (!invitation.event.settings?.allowRsvp) {
      throw new RsvpServiceError("RSVP is closed for this event", 403, "RSVP_CLOSED");
    }

    const deadline = invitation.event.settings.rsvpDeadline;
    if (deadline && new Date() > deadline) {
      throw new RsvpServiceError("RSVP deadline has passed", 403, "RSVP_DEADLINE_PASSED");
    }

    return {
      token,
      event: {
        id: invitation.event.id,
        name: invitation.event.name,
        slug: invitation.event.slug,
        date: invitation.event.date,
        location: invitation.event.location,
        hostName: invitation.event.hostName,
        settings: invitation.event.settings
          ? {
              allowRsvp: invitation.event.settings.allowRsvp,
              allowPlusOnes: invitation.event.settings.allowPlusOnes,
              allowChildren: invitation.event.settings.allowChildren,
              allowMaybe: invitation.event.settings.allowMaybe,
              rsvpDeadline: invitation.event.settings.rsvpDeadline,
            }
          : null,
        theme: invitation.event.theme
          ? {
              primaryColor: invitation.event.theme.primaryColor,
              secondaryColor: invitation.event.theme.secondaryColor,
              accentColor: invitation.event.theme.accentColor,
            }
          : null,
      },
      guest: {
        id: invitation.guest.id,
        firstName: invitation.guest.firstName,
        lastName: invitation.guest.lastName,
        status: invitation.guest.status,
        partySize: invitation.guest.partySize,
        children: invitation.guest.children,
        plusOne: invitation.guest.plusOne,
        plusOneName: invitation.guest.plusOneName,
        dietaryRequirements: invitation.guest.dietaryRequirements,
      },
    };
  },

  async submitRsvp(token: string, input: SubmitRsvpInput, ipAddress?: string) {
    const context = await this.getByToken(token);
    const settings = context.event.settings;

    if (input.status === RsvpStatus.MAYBE && !settings?.allowMaybe) {
      throw new RsvpServiceError("Maybe responses are not allowed", 400, "MAYBE_NOT_ALLOWED");
    }

    const guestStatus = mapRsvpToGuestStatus(input.status);
    const partySize = input.partySize ?? context.guest.partySize;
    const children = settings?.allowChildren ? (input.children ?? context.guest.children) : 0;

    await prisma.$transaction(async (tx) => {
      await tx.rsvpResponse.create({
        data: {
          guestId: context.guest.id,
          status: input.status,
          partySize,
          children,
          dietary: input.dietary ?? null,
          message: input.message ?? null,
        },
      });

      await tx.guest.update({
        where: { id: context.guest.id },
        data: {
          status: guestStatus,
          partySize,
          children,
          dietaryRequirements: input.dietary ?? undefined,
          plusOneName: input.plusOneName ?? undefined,
        },
      });

      await tx.invitation.update({
        where: { rsvpToken: token },
        data: { openedAt: new Date() },
      });
    });

    await auditService.logAudit({
      eventId: context.event.id,
      action: AuditAction.GUEST_RSVP_CHANGED,
      entity: "Guest",
      entityId: context.guest.id,
      metadata: { status: input.status, partySize, children },
      ipAddress,
    });

    return this.getByToken(token);
  },
};
