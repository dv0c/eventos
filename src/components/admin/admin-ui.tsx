import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-white/10 bg-black/30 backdrop-blur-md",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

export function AdminPagination({
  page,
  pageSize,
  total,
  hrefForPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefForPage: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        {page} / {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={hrefForPage(page - 1)}
            className="rounded-full border border-white/15 px-3 py-1 hover:bg-white/5"
          >
            Prev
          </Link>
        ) : null}
        {page < pages ? (
          <Link
            href={hrefForPage(page + 1)}
            className="rounded-full border border-white/15 px-3 py-1 hover:bg-white/5"
          >
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
