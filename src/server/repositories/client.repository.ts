import type { Client, Prisma } from "@prisma/client";

import { prisma } from "@/server/db";

import { clientOrganizationScope, resolvePagination } from "./base";

export type ClientWithEventCount = Prisma.ClientGetPayload<{
  include: { _count: { select: { events: true } } };
}>;

export const clientRepository = {
  async findById(
    organizationId: string,
    clientId: string,
  ): Promise<ClientWithEventCount | null> {
    return prisma.client.findFirst({
      where: {
        id: clientId,
        ...clientOrganizationScope(organizationId),
      },
      include: {
        _count: { select: { events: true } },
      },
    });
  },

  async list(
    organizationId: string,
    options: { search?: string; page?: number; pageSize?: number } = {},
  ): Promise<{ clients: ClientWithEventCount[]; total: number; page: number; pageSize: number }> {
    const { skip, take, page, pageSize } = resolvePagination(options);

    const where: Prisma.ClientWhereInput = {
      ...clientOrganizationScope(organizationId),
      ...(options.search
        ? {
            OR: [
              { name: { contains: options.search, mode: "insensitive" } },
              { email: { contains: options.search, mode: "insensitive" } },
              { company: { contains: options.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [clients, total] = await prisma.$transaction([
      prisma.client.findMany({
        where,
        include: { _count: { select: { events: true } } },
        orderBy: { name: "asc" },
        skip,
        take,
      }),
      prisma.client.count({ where }),
    ]);

    return { clients, total, page, pageSize };
  },

  async create(
    organizationId: string,
    data: Omit<Prisma.ClientCreateInput, "organization">,
  ): Promise<Client> {
    return prisma.client.create({
      data: {
        ...data,
        organization: { connect: { id: organizationId } },
      },
    });
  },

  async update(
    organizationId: string,
    clientId: string,
    data: Prisma.ClientUpdateInput,
  ): Promise<Client> {
    const existing = await prisma.client.findFirst({
      where: { id: clientId, ...clientOrganizationScope(organizationId) },
    });
    if (!existing) {
      throw new Error("Client not found");
    }
    return prisma.client.update({
      where: { id: clientId },
      data,
    });
  },

  async softDelete(organizationId: string, clientId: string): Promise<void> {
    const existing = await prisma.client.findFirst({
      where: { id: clientId, ...clientOrganizationScope(organizationId) },
    });
    if (!existing) return;
    await prisma.client.update({
      where: { id: clientId },
      data: { deletedAt: new Date() },
    });
  },
};
