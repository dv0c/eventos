import { z } from "zod";

import { withAdmin } from "@/app/api/admin/_utils";
import { apiError } from "@/lib/api-response";
import { adminService } from "@/server/services/admin.service";

const querySchema = z.object({
  search: z.string().optional(),
  includeDeleted: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return apiError("Invalid query", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }
  return withAdmin(async () => adminService.listOrganizations(parsed.data));
}
