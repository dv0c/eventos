"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AnalyticsData } from "@/server/services/analytics.service";

interface AnalyticsChartsProps {
  data: AnalyticsData;
  labels: {
    rsvpTitle: string;
    messageTitle: string;
    photosTitle: string;
    rate: string;
    invited: string;
    responded: string;
  };
}

export function AnalyticsCharts({ data, labels }: AnalyticsChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <h3 className="mb-4 font-semibold">{labels.rsvpTitle}</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.rsvpConversion.slice(0, 8)}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="invited" name={labels.invited} fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="responded" name={labels.responded} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4">
        <h3 className="mb-4 font-semibold">{labels.messageTitle}</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.messageDelivery}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis dataKey="status" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4 lg:col-span-2">
        <h3 className="mb-4 font-semibold">{labels.photosTitle}</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.photoUploads}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
