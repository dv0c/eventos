import { getTranslations } from "next-intl/server";

import { AdminPlanEditor } from "@/components/admin/admin-plan-editor";
import {
  AdminPageHeader,
  AdminPagination,
  AdminTable,
} from "@/components/admin/admin-ui";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/server/auth/session";
import { adminService } from "@/server/services/admin.service";

export default async function AdminBillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const t = await getTranslations("admin");
  const sp = await searchParams;
  const tab =
    sp.tab === "subscriptions" || sp.tab === "invoices" ? sp.tab : "plans";
  const page = Number(sp.page ?? 1) || 1;

  const plans =
    tab === "plans" ? await adminService.listPlans() : null;
  const subscriptions =
    tab === "subscriptions"
      ? await adminService.listSubscriptions({ page })
      : null;
  const invoices =
    tab === "invoices" ? await adminService.listInvoices({ page }) : null;

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("billing")} description={t("billingDesc")} />
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["plans", t("plans")],
            ["subscriptions", t("subscriptions")],
            ["invoices", t("payments")],
          ] as const
        ).map(([key, label]) => (
          <Link
            key={key}
            href={`/admin/billing?tab=${key}`}
            className={`rounded-full px-3 py-1.5 text-sm ${
              tab === key
                ? "border border-gold/40 bg-gold/10 text-gold"
                : "border border-white/15"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {plans ? (
        <div className="space-y-4">
          {plans.map((plan) => (
            <AdminPlanEditor key={plan.id} plan={plan} />
          ))}
        </div>
      ) : null}

      {subscriptions ? (
        <>
          <AdminTable>
            <thead>
              <tr className="border-b border-white/10 text-left text-muted-foreground">
                <th className="p-3 font-medium">{t("organization")}</th>
                <th className="p-3 font-medium">{t("plan")}</th>
                <th className="p-3 font-medium">{t("status")}</th>
                <th className="p-3 font-medium">{t("date")}</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.items.map((sub) => (
                <tr key={sub.id} className="border-b border-white/5">
                  <td className="p-3">
                    <Link
                      href={`/admin/organizations/${sub.organization.id}`}
                      className="hover:text-gold"
                    >
                      {sub.organization.name}
                    </Link>
                  </td>
                  <td className="p-3">{sub.plan.name}</td>
                  <td className="p-3">{sub.status}</td>
                  <td className="p-3 text-muted-foreground">
                    {sub.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
          <AdminPagination
            page={subscriptions.page}
            pageSize={subscriptions.pageSize}
            total={subscriptions.total}
            hrefForPage={(p) => `/admin/billing?tab=subscriptions&page=${p}`}
          />
        </>
      ) : null}

      {invoices ? (
        <>
          <AdminTable>
            <thead>
              <tr className="border-b border-white/10 text-left text-muted-foreground">
                <th className="p-3 font-medium">{t("organization")}</th>
                <th className="p-3 font-medium">{t("amount")}</th>
                <th className="p-3 font-medium">{t("status")}</th>
                <th className="p-3 font-medium">{t("date")}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.items.map((inv) => (
                <tr key={inv.id} className="border-b border-white/5">
                  <td className="p-3">
                    {inv.subscription.organization.name}
                  </td>
                  <td className="p-3">
                    {(inv.amount / 100).toFixed(2)} {inv.currency}
                  </td>
                  <td className="p-3">{inv.status}</td>
                  <td className="p-3 text-muted-foreground">
                    {inv.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
          <AdminPagination
            page={invoices.page}
            pageSize={invoices.pageSize}
            total={invoices.total}
            hrefForPage={(p) => `/admin/billing?tab=invoices&page=${p}`}
          />
        </>
      ) : null}
    </div>
  );
}
