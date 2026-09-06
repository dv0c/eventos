import { cn } from "@/lib/utils";

export function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      aria-hidden
    />
  );
}

function EventCardSkeleton() {
  return (
    <article className="dashboard-surface h-full space-y-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <Bone className="h-5 w-2/3" />
        <Bone className="h-5 w-16 shrink-0 rounded-full" />
      </div>
      <Bone className="h-3 w-1/3" />
      <Bone className="h-3.5 w-1/2" />
      <Bone className="h-3.5 w-2/5" />
    </article>
  );
}

export function DashboardFiltersSkeleton() {
  return (
    <div className="flex flex-wrap gap-2" aria-hidden>
      <Bone className="h-9 w-36" />
      <Bone className="h-9 w-28" />
      <Bone className="h-9 w-28" />
      <Bone className="h-9 w-24" />
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-5xl space-y-8"
      aria-busy="true"
      aria-label="Loading"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <Bone className="h-7 w-40 sm:h-8" />
          <Bone className="h-4 w-56" />
          <Bone className="h-4 w-72 max-w-full" />
        </div>
        <Bone className="h-9 w-32 shrink-0" />
      </header>

      <DashboardFiltersSkeleton />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="dashboard-surface flex items-center gap-4 p-4"
          >
            <Bone className="size-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bone className="h-3 w-20" />
              <Bone className="h-6 w-12" />
            </div>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Bone className="h-6 w-36" />
          <Bone className="h-8 w-20" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <EventCardSkeleton key={index} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function EventsListSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-5xl space-y-8"
      aria-busy="true"
      aria-label="Loading"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <Bone className="h-7 w-32 sm:h-8" />
          <Bone className="h-4 w-64 max-w-full" />
        </div>
        <Bone className="h-9 w-32 shrink-0" />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <EventCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function EventWorkspaceSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-5xl space-y-8"
      aria-busy="true"
      aria-label="Loading"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <Bone className="h-7 w-48 sm:h-8" />
            <Bone className="h-5 w-16 rounded-md" />
          </div>
          <Bone className="h-4 w-40" />
        </div>
        <div className="hidden gap-2 sm:flex">
          <Bone className="h-9 w-28" />
          <Bone className="h-9 w-24" />
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="dashboard-surface space-y-2 p-4">
            <Bone className="h-3 w-16" />
            <Bone className="h-7 w-12" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="dashboard-surface space-y-4 p-5">
          <Bone className="h-5 w-32" />
          <Bone className="aspect-[16/10] w-full rounded-lg" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-3/4" />
        </div>
        <div className="dashboard-surface space-y-4 p-5">
          <Bone className="h-5 w-40" />
          <Bone className="aspect-[16/10] w-full rounded-lg" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function SettingsFormSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-5xl space-y-6"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="space-y-2">
        <Bone className="h-7 w-40" />
        <Bone className="h-4 w-64 max-w-full" />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Bone key={index} className="h-9 w-24" />
        ))}
      </div>

      <div className="dashboard-surface space-y-5 p-5 sm:p-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Bone className="h-3.5 w-28" />
            <Bone className="h-10 w-full" />
          </div>
        ))}
        <Bone className="mt-2 h-10 w-28" />
      </div>
    </div>
  );
}

export function EventSidebarSkeleton() {
  return (
    <aside
      className="flex h-full w-56 shrink-0 flex-col border-r border-white/10 bg-sidebar/60 backdrop-blur-xl"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="space-y-3 border-b border-white/10 p-4">
        <Bone className="h-4 w-20" />
        <Bone className="h-8 w-full" />
      </div>
      <nav className="flex flex-1 flex-col gap-1.5 p-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <Bone key={index} className="h-9 w-full rounded-lg" />
        ))}
      </nav>
    </aside>
  );
}

export function CollaboratorsListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-xl border border-border/60 p-3"
        >
          <Bone className="size-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Bone className="h-3.5 w-32" />
            <Bone className="h-3 w-44 max-w-full" />
          </div>
          <Bone className="h-8 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function PhotoWallTabSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Bone className="h-3.5 w-36" />
          <Bone className="h-10 w-full" />
        </div>
      ))}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Bone className="h-4 w-40" />
          <Bone className="h-3 w-56 max-w-full" />
        </div>
        <Bone className="h-6 w-11 shrink-0 rounded-full" />
      </div>
    </div>
  );
}
