import { cn } from "@/lib/utils";

interface EventStatItem {
  label: string;
  value: string | number;
}

interface EventStatStripProps {
  stats: EventStatItem[];
  className?: string;
}

export function EventStatStrip({ stats, className }: EventStatStripProps) {
  return (
    <div
      className={cn(
        "event-surface flex flex-wrap divide-x divide-border/50",
        className,
      )}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="event-stat min-w-[7rem] flex-1 px-5 py-4">
          <span className="event-stat-label">{stat.label}</span>
          <span className="event-stat-value">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}
