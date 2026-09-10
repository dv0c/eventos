import { Locale, PlatformRole } from "@prisma/client";
import { z } from "zod";

import { withAdmin } from "@/app/api/admin/_utils";
import { apiError, getClientIp } from "@/lib/api-response";
import { adminService } from "@/server/services/admin.service";

const patchSchema = z.object({
  name: z.string().trim().nullable().optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().nullable().optional(),
  locale: z.nativeEnum(Locale).optional(),
  platformRole: z.nativeEnum(PlatformRole).optional(),
  softDelete: z.boolean().optional(),
  restore: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  return withAdmin(async () => adminService.getUser(userId));
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid body", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }
  const ip = getClientIp(request);
  return withAdmin(async (adminId) => {
    if (parsed.data.softDelete) {
      return adminService.softDeleteUser(adminId, userId, ip);
    }
    if (parsed.data.restore) {
      return adminService.restoreUser(adminId, userId, ip);
    }
    const { softDelete: _s, restore: _r, ...patch } = parsed.data;
    return adminService.updateUser(adminId, userId, patch, ip);
  });
}
