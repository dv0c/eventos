import { FileStack, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getActiveOrganizationId,
  requireAuth,
} from "@/server/auth/session";
import { templateService } from "@/server/services/template.service";

export default async function TemplatesPage() {
  const t = await getTranslations("templates");
  const tEvents = await getTranslations("events");
  const session = await requireAuth();
  const organizationId = await getActiveOrganizationId();

  if (!organizationId) {
    return (
      <EmptyState icon={FileStack} title={t("noTemplates")} description={t("noTemplatesDesc")} />
    );
  }

  const templates = await templateService.listTemplates(session.user.id, organizationId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button variant="gold" disabled>
          <Plus className="h-4 w-4" />
          {t("createFromEvent")}
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState icon={FileStack} title={t("noTemplates")} description={t("noTemplatesDesc")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="surface-elevated">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{template.name}</h3>
                  <Badge variant="outline">
                    {tEvents(`types.${template.type.toLowerCase()}` as "types.wedding")}
                  </Badge>
                </div>
                {template.description ? (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                ) : null}
                <p className="mt-3 text-xs text-muted-foreground">{t("includesNote")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
