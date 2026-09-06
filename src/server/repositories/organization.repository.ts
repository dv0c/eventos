import type { Organization, OrganizationMember, OrgRole, Prisma } from "@prisma/client";

import { prisma } from "@/server/db";

import { organizationScope } from "./base";

export type OrganizationWithPlan = Prisma.OrganizationGetPayload<{
  include: { plan: true };
}>;

export type OrganizationMemberWithUser = Prisma.OrganizationMemberGetPayload<{
  include: { user: true };
}>;

export type UserOrganization = Prisma.OrganizationMemberGetPayload<{
  include: {
    organization: {
      include: { plan: true };
    };
  };
}>;

export const organizationRepository = {
  async findById(id: string): Promise<OrganizationWithPlan | null> {
    return prisma.organization.findFirst({
      where: organizationScope(id),
      include: { plan: true },
    });
  },

  async findBySlug(slug: string): Promise<OrganizationWithPlan | null> {
    return prisma.organization.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      include: { plan: true },
    });
  },

  async getMembers(organizationId: string): Promise<OrganizationMemberWithUser[]> {
    return prisma.organizationMember.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });
  },

  async getUserOrganizations(userId: string): Promise<UserOrganization[]> {
    return prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: { plan: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  async getMembership(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMember | null> {
    return prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
  },

  async create(
    data: Prisma.OrganizationCreateInput,
  ): Promise<Organization> {
    return prisma.organization.create({ data });
  },

  async update(
    id: string,
    data: Prisma.OrganizationUpdateInput,
  ): Promise<Organization> {
    return prisma.organization.update({
      where: { id },
      data,
    });
  },

  async addMember(
    organizationId: string,
    userId: string,
    role: OrgRole,
  ): Promise<OrganizationMember> {
    return prisma.organizationMember.create({
      data: {
        organizationId,
        userId,
        role,
      },
    });
  },
};
