import {
  AuditAction,
  InviteStatus,
  OrgMode,
  OrgRole,
  SubscriptionStatus,
  type Organization,
  type OrganizationInvite,
  type OrganizationMember,
  type Prisma,
} from "@prisma/client";
import { nanoid } from "nanoid";

import { generateUniqueSlug } from "@/lib/slug";
import { prisma } from "@/server/db";
import { enforceOrganizationAccess } from "@/server/permissions/enforce";
import { organizationRepository } from "@/server/repositories/organization.repository";

import { auditService } from "./audit.service";
import { PlanLimitError, planLimitsService } from "./plan-limits.service";

const DEFAULT_PLAN_SLUG = "free";
const INVITE_EXPIRY_DAYS = 7;

export interface CreateOrganizationInput {
  name: string;
  planSlug?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface InviteMemberInput {
  email: string;
  role?: OrgRole;
}

export interface AcceptInviteInput {
  token: string;
}

export class OrganizationServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "OrganizationServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const organizationService = {
  async createOrganization(
    userId: string,
    input: CreateOrganizationInput,
    ipAddress?: string,
  ): Promise<Organization> {
    try {
      await planLimitsService.assertCanCreateOrganization(userId);
    } catch (error) {
      if (error instanceof PlanLimitError) {
        throw new OrganizationServiceError(
          error.message,
          error.statusCode,
          error.code,
        );
      }
      throw error;
    }

    const plan = await prisma.plan.findFirst({
      where: {
        slug: input.planSlug ?? DEFAULT_PLAN_SLUG,
        isActive: true,
      },
    });

    if (!plan) {
      throw new OrganizationServiceError("Plan not found", 404, "PLAN_NOT_FOUND");
    }

    const slug = await generateUniqueSlug(input.name, async (candidate) => {
      const existing = await organizationRepository.findBySlug(candidate);
      return existing !== null;
    });

    const organization = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.organization.create({
        data: {
          name: input.name.trim(),
          slug,
          planId: plan.id,
          primaryColor: input.primaryColor,
          secondaryColor: input.secondaryColor,
          members: {
            create: {
              userId,
              role: OrgRole.OWNER,
            },
          },
          subscriptions: {
            create: {
              planId: plan.id,
              status: SubscriptionStatus.TRIALING,
            },
          },
        },
      });

      return created;
    });

    await auditService.logAudit({
      userId,
      organizationId: organization.id,
      action: AuditAction.ORG_CREATED,
      entity: "Organization",
      entityId: organization.id,
      metadata: { name: organization.name, slug: organization.slug },
      ipAddress,
    });

    return organization;
  },

  async switchOrganization(
    userId: string,
    organizationId: string,
  ): Promise<Organization> {
    await enforceOrganizationAccess(userId, organizationId, "org:read");

    const organization = await organizationRepository.findById(organizationId);

    if (!organization) {
      throw new OrganizationServiceError("Organization not found", 404, "ORG_NOT_FOUND");
    }

    return organization;
  },

  async updateLogoUrl(
    userId: string,
    organizationId: string,
    logoUrl: string | null,
    ipAddress?: string,
  ): Promise<Organization> {
    return this.updateBranding(userId, organizationId, { logoUrl }, ipAddress);
  },

  async updateBranding(
    userId: string,
    organizationId: string,
    input: {
      logoUrl?: string | null;
      name?: string;
      brandName?: string | null;
      primaryColor?: string | null;
      secondaryColor?: string | null;
      mode?: "B2B";
    },
    ipAddress?: string,
  ): Promise<Organization> {
    await enforceOrganizationAccess(userId, organizationId, "org:manage_settings");

    const existing = await organizationRepository.findById(organizationId);
    if (!existing) {
      throw new OrganizationServiceError("Organization not found", 404, "ORG_NOT_FOUND");
    }

    if (input.mode === "B2B" && existing.mode === "B2C") {
      const membership = await organizationRepository.getMembership(organizationId, userId);
      if (membership?.role !== OrgRole.OWNER) {
        throw new OrganizationServiceError(
          "Only the owner can convert to B2B",
          403,
          "OWNER_REQUIRED",
        );
      }
    }

    if (
      (input.name !== undefined ||
        input.brandName !== undefined ||
        input.primaryColor !== undefined ||
        input.secondaryColor !== undefined) &&
      existing.mode !== "B2B" &&
      input.mode !== "B2B"
    ) {
      throw new OrganizationServiceError(
        "Convert to B2B to edit whitelabel branding",
        403,
        "B2B_REQUIRED",
      );
    }

    const data: Prisma.OrganizationUpdateInput = {};
    if (input.logoUrl !== undefined) data.logoUrl = input.logoUrl;
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.brandName !== undefined) data.brandName = input.brandName?.trim() || null;
    if (input.primaryColor !== undefined) data.primaryColor = input.primaryColor;
    if (input.secondaryColor !== undefined) data.secondaryColor = input.secondaryColor;
    if (input.mode === "B2B") data.mode = OrgMode.B2B;

    const organization = await organizationRepository.update(organizationId, data);

    await auditService.logAudit({
      userId,
      organizationId,
      action: AuditAction.ORG_UPDATED,
      entity: "Organization",
      entityId: organizationId,
      metadata: { ...input },
      ipAddress,
    });

    return organization;
  },

  async inviteMember(
    userId: string,
    organizationId: string,
    input: InviteMemberInput,
    ipAddress?: string,
  ): Promise<OrganizationInvite> {
    await enforceOrganizationAccess(userId, organizationId, "org:manage_members");

    const email = input.email.trim().toLowerCase();
    const role = input.role ?? OrgRole.VIEWER;

    if (role === OrgRole.OWNER) {
      throw new OrganizationServiceError(
        "Cannot invite members as owner",
        400,
        "INVALID_ROLE",
      );
    }

    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        user: { email },
      },
    });

    if (existingMember) {
      throw new OrganizationServiceError(
        "User is already a member",
        409,
        "MEMBER_EXISTS",
      );
    }

    const pendingInvite = await prisma.organizationInvite.findFirst({
      where: {
        organizationId,
        email,
        status: InviteStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (pendingInvite) {
      throw new OrganizationServiceError(
        "An active invite already exists for this email",
        409,
        "INVITE_EXISTS",
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    const invite = await prisma.organizationInvite.create({
      data: {
        organizationId,
        email,
        role,
        token: nanoid(32),
        invitedById: userId,
        expiresAt,
      },
    });

    await auditService.logAudit({
      userId,
      organizationId,
      action: AuditAction.COLLABORATOR_ADDED,
      entity: "OrganizationInvite",
      entityId: invite.id,
      metadata: { email, role },
      ipAddress,
    });

    return invite;
  },

  async acceptInvite(
    userId: string,
    input: AcceptInviteInput,
    ipAddress?: string,
  ): Promise<OrganizationMember> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new OrganizationServiceError("User not found", 404, "USER_NOT_FOUND");
    }

    const invite = await prisma.organizationInvite.findUnique({
      where: { token: input.token },
    });

    if (!invite) {
      throw new OrganizationServiceError("Invite not found", 404, "INVITE_NOT_FOUND");
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new OrganizationServiceError(
        "Invite is no longer valid",
        410,
        "INVITE_INVALID",
      );
    }

    if (invite.expiresAt < new Date()) {
      await prisma.organizationInvite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.EXPIRED },
      });
      throw new OrganizationServiceError("Invite has expired", 410, "INVITE_EXPIRED");
    }

    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new OrganizationServiceError(
        "Invite email does not match your account",
        403,
        "INVITE_EMAIL_MISMATCH",
      );
    }

    const existingMember = await organizationRepository.getMembership(
      invite.organizationId,
      userId,
    );

    if (existingMember) {
      throw new OrganizationServiceError(
        "You are already a member of this organization",
        409,
        "MEMBER_EXISTS",
      );
    }

    const member = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.organizationInvite.update({
        where: { id: invite.id },
        data: {
          status: InviteStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      return tx.organizationMember.create({
        data: {
          organizationId: invite.organizationId,
          userId,
          role: invite.role,
        },
      });
    });

    await auditService.logAudit({
      userId,
      organizationId: invite.organizationId,
      action: AuditAction.COLLABORATOR_ADDED,
      entity: "OrganizationMember",
      entityId: member.id,
      metadata: { inviteId: invite.id, role: member.role },
      ipAddress,
    });

    return member;
  },
};
