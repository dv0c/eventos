import { cn } from "@/lib/utils";

function AppBone({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-white/10", className)}
      aria-hidden
    />
  );
}

function AlbumFeedPostSkeleton({ showActions = false }: { showActions?: boolean }) {
  return (
    <li className="bg-neutral-950">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <AppBone className="size-8 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <AppBone className="h-3.5 w-28" />
          <AppBone className="h-2.5 w-20" />
        </div>
      </div>
      <AppBone className="aspect-square w-full rounded-none" />
      <div className="flex flex-wrap items-center gap-2 px-3 pt-3">
        <AppBone className="h-8 w-8 rounded-full" />
        <AppBone className="h-8 w-8 rounded-full" />
        <AppBone className="h-8 w-8 rounded-full" />
        <AppBone className="h-8 w-8 rounded-full" />
      </div>
      <div className="space-y-2 px-3 pb-4 pt-2">
        <AppBone className="h-3 w-full" />
        <AppBone className="h-3 w-2/3" />
      </div>
      {showActions ? (
        <div className="flex gap-2 px-3 pb-3">
          <AppBone className="h-11 flex-1 rounded-xl" />
          <AppBone className="h-11 flex-1 rounded-xl" />
        </div>
      ) : null}
    </li>
  );
}

export function AlbumFeedListSkeleton({
  count = 3,
  showActions = false,
}: {
  count?: number;
  showActions?: boolean;
}) {
  return (
    <ul className="divide-y divide-white/10" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <AlbumFeedPostSkeleton key={index} showActions={showActions} />
      ))}
    </ul>
  );
}

export function ModFeedListSkeleton({
  showActions = true,
}: {
  showActions?: boolean;
}) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      aria-busy="true"
      aria-label="Loading"
    >
      <AlbumFeedListSkeleton count={3} showActions={showActions} />
    </div>
  );
}

export function AlbumAppShellSkeleton() {
  return (
    <div
      className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-lg flex-col overflow-hidden bg-neutral-950/80 md:bg-neutral-950/90"
      aria-busy="true"
      aria-label="Loading"
    >
      <header
        className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-neutral-950/90 backdrop-blur-xl"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="relative mx-auto flex h-14 w-full max-w-lg items-center gap-3 px-4">
          <div className="z-10 flex min-w-0 flex-1 items-center gap-3">
            <AppBone className="size-8 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <AppBone className="h-4 w-36" />
              <AppBone className="h-2.5 w-20" />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <AppBone className="h-7 w-7 rounded-md" />
          </div>
          <div className="z-10 w-8 shrink-0" aria-hidden />
        </div>
      </header>

      <div
        className="min-h-0 flex-1 overflow-hidden"
        style={{
          paddingTop: "calc(3.5rem + env(safe-area-inset-top))",
          paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))",
        }}
        data-app-scroll
      >
        <AlbumFeedListSkeleton count={2} />
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-neutral-950/90 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-hidden
      >
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-1.5">
              <AppBone className="size-5 rounded-md" />
              <AppBone className="h-2 w-8" />
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function WishCountSkeleton() {
  return <AppBone className="mt-3 h-10 w-full rounded-xl" />;
}
