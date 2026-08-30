"use client";

import type { GuestStatus } from "@prisma/client";
import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { GuidancePanel } from "@/components/events/guidance-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventOverviewStats } from "@/server/repositories/event.repository";
import { formatNumber } from "@/lib/format";
import { useLocale } from "next-intl";

interface EventOverviewProps {
  stats: EventOverviewStats;
  eventName: string;
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const STATUS_KEYS: Record<GuestStatus, string> = {
  PENDING: "pending",
  INVITED: "invited",
  CONFIRMED: "confirmed",
  DECLINED: "declined",
  MAYBE: "maybe",
  NO_RESPONSE: "noResponse",
};

export function EventOverview({ stats, eventName }: EventOverviewProps) {
  const t = useTranslations("overview");
  const tGuests = useTranslations("guests");
  const locale = useLocale() as "el" | "en";

  const pieData = Object.entries(stats.guestsByStatus)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: tGuests(`statuses.${STATUS_KEYS[status as GuestStatus]}`),
      value: count,
    }));

  const barData = [
    { name: t("confirmed"), value: stats.confirmedCount },
    { name: t("declined"), value: stats.declinedCount },
    { name: t("pending"), value: stats.pendingCount },
  ];

  const statCards = [
    { label: t("totalGuests"), value: formatNumber(stats.totalGuests, locale) },
    {
      label: t("rsvpRate"),
      value: `${Math.round(stats.rsvpRate * 100)}%`,
    },
    {
      label: t("tasksProgress"),
      value:
        stats.totalTasks > 0
          ? `${stats.completedTasks}/${stats.totalTasks}`
          : "—",
    },
    {
      label: t("daysUntilEvent"),
      value: stats.daysUntilEvent > 0 ? stats.daysUntilEvent : t("todayOrPast"),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{eventName}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label} className="surface-elevated">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="surface-elevated lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">{t("rsvpBreakdown")}</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {t("noGuestData")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="surface-elevated lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">{t("rsvpSummary")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <GuidancePanel
          daysUntilEvent={stats.daysUntilEvent}
          totalGuests={stats.totalGuests}
          confirmedCount={stats.confirmedCount}
          totalTasks={stats.totalTasks}
          completedTasks={stats.completedTasks}
        />
      </div>
    </div>
  );
}
