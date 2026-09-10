import { SubscriptionStatus, type Prisma } from "@prisma/client";
import { z } from "zod";

import { withAdmin } from "@/app/api/admin/_utils";
import { apiError, getClientIp } from "@/lib/api-response";
import { adminService } from "@/server/services/admin.service";

const querySchema = z.object({
  tab: z.enum(["plans", "subscriptions", "invoices"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

const patchSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("plan"),
    id: z.string(),
    name: z.string().optional(),
    description: z.string().nullable().optional(),
    priceMonthly: z.number().int().optional(),
    priceYearly: z.number().int().optional(),
    limits: z.unknown().optional(),
    features: z.unknown().optional(),
    isActive: z.boolean().optional(),
    stripePriceIdMonthly: z.string().nullable().optional(),
    stripePriceIdYearly: z.string().nullable().optional(),
    sortOrder: z.number().int().optional(),
  }),
  z.object({
    kind: z.literal("subscription"),
    id: z.string(),
    status: z.nativeEnum(SubscriptionStatus).optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
    planId: z.string().optional(),
  }),
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return apiError("Invalid query", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }
  return withAdmin(async () => {
    const tab = parsed.data.tab ?? "plans";
    if (tab === "subscriptions") {
      return adminService.listSubscriptions({
        page: parsed.data.page,
        pageSize: parsed.data.pageSize,
      });
    }
    if (tab === "invoices") {
      return adminService.listInvoices({
        page: parsed.data.page,
        pageSize: parsed.data.pageSize,
      });
    }
    return { items: await adminService.listPlans() };
  });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid body", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }
  const ip = getClientIp(request);
  return withAdmin(async (adminId) => {
    if (parsed.data.kind === "plan") {
      const { kind: _k, id, ...data } = parsed.data;
      return adminService.updatePlan(
        adminId,
        id,
        {
          ...data,
          limits: data.limits as Prisma.InputJsonValue | undefined,
          features: data.features as Prisma.InputJsonValue | undefined,
        },
        ip,
      );
    }
    const { kind: _k, id, ...data } = parsed.data;
    return adminService.updateSubscription(adminId, id, data, ip);
  });
}
