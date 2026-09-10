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

interface SeriesPoint {
  date: string;
  count: number;
}

interface StatusPoint {
  status: string;
  count: number;
}

export function AdminAnalyticsCharts({
  signups,
  eventsCreated,
  mediaUploads,
  subscriptionsByStatus,
  labels,
}: {
  signups: SeriesPoint[];
  eventsCreated: SeriesPoint[];
  mediaUploads: SeriesPoint[];
  subscriptionsByStatus: StatusPoint[];
  labels: {
    signups: string;
    events: string;
    media: string;
    subscriptions: string;
  };
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title={labels.signups}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={signups}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--gold)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={labels.events}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={eventsCreated}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={labels.media}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={mediaUploads}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={labels.subscriptions}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={subscriptionsByStatus}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis dataKey="status" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="var(--gold)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4 backdrop-blur-md">
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}
