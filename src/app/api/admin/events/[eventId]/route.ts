import { EventStatus, EventType } from "@prisma/client";
import { z } from "zod";

import { withAdmin } from "@/app/api/admin/_utils";
import { apiError, getClientIp } from "@/lib/api-response";
import { adminService } from "@/server/services/admin.service";

const patchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  status: z.nativeEnum(EventStatus).optional(),
  type: z.nativeEnum(EventType).optional(),
  description: z.string().nullable().optional(),
  date: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  hostName: z.string().nullable().optional(),
  hostEmail: z.string().nullable().optional(),
  hostPhone: z.string().nullable().optional(),
  softDelete: z.boolean().optional(),
  restore: z.boolean().optional(),
  settings: z
    .object({
      isPublic: z.boolean().optional(),
      enableGallery: z.boolean().optional(),
      enableWall: z.boolean().optional(),
      enableVoiceWishes: z.boolean().optional(),
      enableSongRequests: z.boolean().optional(),
      requireManualApproval: z.boolean().optional(),
    })
    .optional(),
  theme: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      accentColor: z.string().optional(),
      logoUrl: z.string().nullable().optional(),
      albumBackgroundUrl: z.string().nullable().optional(),
    })
    .optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await context.params;
  return withAdmin(async () => adminService.getEvent(eventId));
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await context.params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid body", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }
  const ip = getClientIp(request);
  return withAdmin(async (adminId) => {
    if (parsed.data.softDelete) {
      return adminService.softDeleteEvent(adminId, eventId, ip);
    }
    if (parsed.data.restore) {
      return adminService.restoreEvent(adminId, eventId, ip);
    }
    if (parsed.data.settings) {
      await adminService.updateEventSettings(
        adminId,
        eventId,
        parsed.data.settings,
        ip,
      );
    }
    if (parsed.data.theme) {
      await adminService.updateEventTheme(adminId, eventId, parsed.data.theme, ip);
    }
    const {
      softDelete: _s,
      restore: _r,
      settings: _set,
      theme: _t,
      ...patch
    } = parsed.data;
    if (Object.keys(patch).length > 0) {
      return adminService.updateEvent(adminId, eventId, patch, ip);
    }
    return adminService.getEvent(eventId);
  });
}
