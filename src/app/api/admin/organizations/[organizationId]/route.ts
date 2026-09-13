import { OrgMode, OrgRole } from "@prisma/client";
import { z } from "zod";

import { withAdmin } from "@/app/api/admin/_utils";
import { apiError, getClientIp } from "@/lib/api-response";
import { adminService } from "@/server/services/admin.service";

const patchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
  mode: z.nativeEnum(OrgMode).optional(),
  brandName: z.string().trim().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  primaryColor: z.string().nullable().optional(),
  secondaryColor: z.string().nullable().optional(),
  customDomain: z.string().nullable().optional(),
  planId: z.string().optional(),
  softDelete: z.boolean().optional(),
  restore: z.boolean().optional(),
  member: z
    .object({
      memberId: z.string(),
      role: z.nativeEnum(OrgRole).optional(),
      remove: z.boolean().optional(),
    })
    .optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await context.params;
  return withAdmin(async () => adminService.getOrganization(organizationId));
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await context.params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid body", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }
  const ip = getClientIp(request);
  return withAdmin(async (adminId) => {
    if (parsed.data.softDelete) {
      return adminService.softDeleteOrganization(adminId, organizationId, ip);
    }
    if (parsed.data.restore) {
      return adminService.restoreOrganization(adminId, organizationId, ip);
    }
    if (parsed.data.member) {
      const { memberId, role, remove } = parsed.data.member;
      if (remove) {
        await adminService.removeMember(adminId, organizationId, memberId, ip);
        return { ok: true };
      }
      if (role) {
        return adminService.updateMemberRole(
          adminId,
          organizationId,
          memberId,
          role,
          ip,
        );
      }
    }
    const { softDelete: _s, restore: _r, member: _m, ...patch } = parsed.data;
    return adminService.updateOrganization(adminId, organizationId, patch, ip);
  });
}
