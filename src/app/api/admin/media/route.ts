import { MediaStatus } from "@prisma/client";
import { z } from "zod";

import { withAdmin } from "@/app/api/admin/_utils";
import { apiError, getClientIp } from "@/lib/api-response";
import {
  AdminServiceError,
  adminService,
} from "@/server/services/admin.service";

const querySchema = z.object({
  status: z.nativeEnum(MediaStatus).optional(),
  eventId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  tab: z.enum(["media", "wishes"]).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return apiError("Invalid query", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }
  return withAdmin(async () => {
    if (parsed.data.tab === "wishes") {
      return adminService.listVoiceWishes({
        page: parsed.data.page,
        pageSize: parsed.data.pageSize,
      });
    }
    return adminService.listMedia(parsed.data);
  });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const schema = z.object({
    id: z.string(),
    action: z.enum(["approve", "reject", "feature", "delete"]),
    kind: z.enum(["media", "wish"]).optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid body", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }
  const ip = getClientIp(request);
  return withAdmin(async (adminId) => {
    if (parsed.data.kind === "wish") {
      if (parsed.data.action !== "delete") {
        throw new AdminServiceError(
          "Only delete supported for wishes",
          400,
          "INVALID_ACTION",
        );
      }
      await adminService.deleteVoiceWish(adminId, parsed.data.id, ip);
      return { ok: true };
    }
    if (parsed.data.action === "delete") {
      await adminService.deleteMedia(adminId, parsed.data.id, ip);
      return { ok: true };
    }
    return adminService.moderateMedia(
      adminId,
      parsed.data.id,
      parsed.data.action,
      ip,
    );
  });
}
