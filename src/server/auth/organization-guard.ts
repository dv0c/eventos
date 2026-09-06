import type { OrgRole } from "@prisma/client";
import { cache } from "react";

import { orgPath } from "@/lib/org-path";
import { redirect } from "@/i18n/navigation";
import { getActiveOrganizationId } from "@/server/auth/session";
import { organizationRepository } from "@/server/repositories/organization.repository";
import { platformOrgService } from "@/server/services/platform-org.service";

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface ResolvedOrganization extends OrganizationSummary {
  role: OrgRole;
  planName: string;
  planSlug: string;
}

export class OrganizationAccessError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "OrganizationAccessError";
    this.code = code;
  }
}

export async function getUserOrganizationsSummary(
  userId: string,
): Promise<OrganizationSummary[]> {
  const memberships = await organizationRepository.getUserOrganizations(userId);

  return memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    logoUrl: m.organization.logoUrl,
  }));
}

export async function resolveOrganizationBySlug(
  userId: string,
  orgSlug: string,
): Promise<ResolvedOrganization> {
  const organization = await organizationRepository.findBySlug(orgSlug);

  if (!organization) {
    throw new OrganizationAccessError("Organization not found", "ORG_NOT_FOUND");
  }

  const membership = await organizationRepository.getMembership(organization.id, userId);

  if (!membership) {
    throw new OrganizationAccessError(
      "You are not a member of this organization",
      "ORG_FORBIDDEN",
    );
  }

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    logoUrl: organization.logoUrl,
    role: membership.role,
    planName: organization.plan.name,
    planSlug: organization.plan.slug,
  };
}

export const getOrganizationBySlug = cache(
  async (userId: string, orgSlug: string): Promise<ResolvedOrganization> =>
    resolveOrganizationBySlug(userId, orgSlug),
);

export async function resolveActiveOrganization(
  userId: string,
): Promise<ResolvedOrganization | null> {
  const organizations = await getUserOrganizationsSummary(userId);

  if (organizations.length === 0) {
    return null;
  }

  const activeOrganizationId = await getActiveOrganizationId();
  const activeFromCookie = organizations.find((org) => org.id === activeOrganizationId);

  if (activeFromCookie) {
    try {
      return await resolveOrganizationBySlug(userId, activeFromCookie.slug);
    } catch {
      // fall through to first org
    }
  }

  const fallback = organizations[0];
  try {
    return await resolveOrganizationBySlug(userId, fallback.slug);
  } catch {
    return null;
  }
}

export async function redirectIfNoOrganizations(
  locale: string,
  userId: string,
): Promise<OrganizationSummary[]> {
  let organizations = await getUserOrganizationsSummary(userId);

  if (organizations.length === 0) {
    await platformOrgService.ensurePlatformMembership(userId);
    organizations = await getUserOrganizationsSummary(userId);
  }

  if (organizations.length === 0) {
    redirect({ href: "/dashboard", locale });
  }

  return organizations;
}

export async function redirectIfHasOrganizations(
  locale: string,
  userId: string,
): Promise<void> {
  const active = await resolveActiveOrganization(userId);

  if (active) {
    redirect({ href: orgPath(active.slug, "/dashboard"), locale });
  }
}

export async function redirectToActiveOrganizationDashboard(
  locale: string,
  userId: string,
): Promise<never> {
  let active = await resolveActiveOrganization(userId);

  if (!active) {
    await platformOrgService.ensurePlatformMembership(userId);
    active = await resolveActiveOrganization(userId);
  }

  if (!active) {
    throw new OrganizationAccessError(
      "Platform organization is not available",
      "PLATFORM_ORG_MISSING",
    );
  }

  return redirect({ href: orgPath(active.slug, "/dashboard"), locale });
}
