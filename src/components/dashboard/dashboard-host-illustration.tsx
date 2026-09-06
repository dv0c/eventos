import { DASHBOARD_HOST_WAVE_IMAGE } from "@/components/dashboard/dashboard-assets";

export function DashboardHostIllustration() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-0 bottom-0 z-0 hidden h-[min(55vh,420px)] w-[min(22vw,320px)] select-none bg-contain bg-bottom bg-no-repeat lg:block"
      style={{
        backgroundImage: `url(${DASHBOARD_HOST_WAVE_IMAGE})`,
      }}
    />
  );
}
