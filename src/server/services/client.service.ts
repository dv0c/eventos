import { AuditAction, type Client } from "@prisma/client";

import { enforceOrganizationAccess } from "@/server/permissions/enforce";
import { clientRepository } from "@/server/repositories/client.repository";

import { auditService } from "./audit.service";

export class ClientServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "ClientServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface CreateClientInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {}

export const clientService = {
  async listClients(
    userId: string,
    organizationId: string,
    options: { search?: string; page?: number; pageSize?: number } = {},
  ) {
    await enforceOrganizationAccess(userId, organizationId, "org:read");
    return clientRepository.list(organizationId, options);
  },

  async getClient(userId: string, organizationId: string, clientId: string) {
    await enforceOrganizationAccess(userId, organizationId, "org:read");
    const client = await clientRepository.findById(organizationId, clientId);
    if (!client) {
      throw new ClientServiceError("Client not found", 404, "CLIENT_NOT_FOUND");
    }
    return client;
  },

  async createClient(
    userId: string,
    organizationId: string,
    input: CreateClientInput,
    ipAddress?: string,
  ): Promise<Client> {
    await enforceOrganizationAccess(userId, organizationId, "org:update");

    const client = await clientRepository.create(organizationId, {
      name: input.name.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      company: input.company?.trim() || null,
      notes: input.notes ?? null,
    });

    await auditService.logAudit({
      userId,
      organizationId,
      action: AuditAction.ORG_UPDATED,
      entity: "Client",
      entityId: client.id,
      metadata: { name: client.name },
      ipAddress,
    });

    return client;
  },

  async updateClient(
    userId: string,
    organizationId: string,
    clientId: string,
    input: UpdateClientInput,
    ipAddress?: string,
  ): Promise<Client> {
    await enforceOrganizationAccess(userId, organizationId, "org:update");

    const existing = await clientRepository.findById(organizationId, clientId);
    if (!existing) {
      throw new ClientServiceError("Client not found", 404, "CLIENT_NOT_FOUND");
    }

    const client = await clientRepository.update(organizationId, clientId, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.email !== undefined ? { email: input.email?.trim() || null } : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
      ...(input.company !== undefined ? { company: input.company?.trim() || null } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });

    await auditService.logAudit({
      userId,
      organizationId,
      action: AuditAction.ORG_UPDATED,
      entity: "Client",
      entityId: clientId,
      metadata: input as import("@prisma/client").Prisma.InputJsonValue,
      ipAddress,
    });

    return client;
  },

  async deleteClient(
    userId: string,
    organizationId: string,
    clientId: string,
    ipAddress?: string,
  ): Promise<void> {
    await enforceOrganizationAccess(userId, organizationId, "org:update");

    const existing = await clientRepository.findById(organizationId, clientId);
    if (!existing) {
      throw new ClientServiceError("Client not found", 404, "CLIENT_NOT_FOUND");
    }

    await clientRepository.softDelete(organizationId, clientId);

    await auditService.logAudit({
      userId,
      organizationId,
      action: AuditAction.ORG_UPDATED,
      entity: "Client",
      entityId: clientId,
      metadata: { deleted: true },
      ipAddress,
    });
  },

  async linkEventToClient(
    userId: string,
    organizationId: string,
    eventId: string,
    clientId: string | null,
    ipAddress?: string,
  ): Promise<void> {
    await enforceOrganizationAccess(userId, organizationId, "event:update");

    if (clientId) {
      const client = await clientRepository.findById(organizationId, clientId);
      if (!client) {
        throw new ClientServiceError("Client not found", 404, "CLIENT_NOT_FOUND");
      }
    }

    const { prisma } = await import("@/server/db");
    await prisma.event.update({
      where: {
        id: eventId,
        organizationId,
        deletedAt: null,
      },
      data: { clientId },
    });

    await auditService.logAudit({
      userId,
      organizationId,
      eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "Event",
      entityId: eventId,
      metadata: { clientId },
      ipAddress,
    });
  },
};
