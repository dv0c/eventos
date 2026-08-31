import { Suspense } from "react";
import { Building2, Mail, Phone, Plus, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { clientService } from "@/server/services/client.service";

export default async function ClientsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const t = await getTranslations("clients");
  const session = await requireAuth();
  const organizationId = (await getOrganizationBySlug(session.user.id, orgSlug)).id;

  const { clients, total } = await clientService.listClients(
    session.user.id,
    organizationId,
    { pageSize: 50 },
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button variant="gold" disabled>
          <Plus className="h-4 w-4" />
          {t("add")}
        </Button>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("noClients")}
          description={t("noClientsDesc")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="surface-elevated">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{client.name}</h3>
                  <Badge variant="secondary">
                    {t("eventCount", { count: client._count.events })}
                  </Badge>
                </div>
                {client.company ? (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    {client.company}
                  </p>
                ) : null}
                {client.email ? (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {client.email}
                  </p>
                ) : null}
                {client.phone ? (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {client.phone}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground">{t("totalCount", { count: total })}</p>
    </div>
  );
}
