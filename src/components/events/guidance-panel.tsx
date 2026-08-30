"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface GuidancePanelProps {
  daysUntilEvent: number;
  totalGuests: number;
  confirmedCount: number;
  totalTasks: number;
  completedTasks: number;
  className?: string;
}

export function GuidancePanel({
  daysUntilEvent,
  totalGuests,
  confirmedCount,
  totalTasks,
  completedTasks,
  className,
}: GuidancePanelProps) {
  const t = useTranslations("guidance");

  const checklist = [
    {
      id: "guests",
      label: t("checklistGuests"),
      done: totalGuests > 0,
    },
    {
      id: "rsvp",
      label: t("checklistRsvp"),
      done: confirmedCount > 0,
    },
    {
      id: "tasks",
      label: t("checklistTasks"),
      done: totalTasks > 0 && completedTasks === totalTasks,
    },
  ];

  const completedChecklist = checklist.filter((item) => item.done).length;
  const checklistProgress =
    checklist.length > 0 ? (completedChecklist / checklist.length) * 100 : 0;

  return (
    <Card className={cn("surface-elevated", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-4">
          <p className="text-sm text-muted-foreground">{t("daysUntil")}</p>
          <p className="text-3xl font-bold text-gradient-gold">
            {daysUntilEvent > 0 ? daysUntilEvent : 0}
          </p>
          <p className="text-sm text-muted-foreground">
            {daysUntilEvent <= 0 ? t("eventToday") : t("daysLabel")}
          </p>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium">{t("checklistTitle")}</span>
            <span className="text-muted-foreground">
              {completedChecklist}/{checklist.length}
            </span>
          </div>
          <Progress value={checklistProgress} className="mb-4 h-2" />
          <ul className="space-y-3">
            {checklist.map((item) => (
              <li key={item.id} className="flex items-center gap-3 text-sm">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className={item.done ? "text-foreground" : "text-muted-foreground"}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
