export default function DashboardLoading() {
  return (
    <div
      className="flex min-h-dvh w-full items-center justify-center"
      style={{ background: "#e5d8d3" }}
    >
      <div
        className="flex overflow-hidden"
        style={{
          width: "min(901px, calc(100vw - 24px))",
          height: "min(562px, calc(100dvh - 24px))",
          borderRadius: 20,
          background: "#faf5ef",
          boxShadow: "0 12px 40px rgba(40, 30, 25, 0.08)",
        }}
      >
        <div
          className="hidden shrink-0 animate-pulse bg-[#f3eee8] md:block"
          style={{ width: "17.425%" }}
        />
        <div className="flex min-w-0 flex-1 flex-col p-5">
          <div className="mx-auto h-6 w-32 animate-pulse rounded bg-[#efe9e2]" />
          <div className="mt-4 min-h-0 flex-1 animate-pulse rounded-[18px] bg-white/80" />
        </div>
        <div
          className="hidden shrink-0 animate-pulse bg-[#f3eee8] lg:block"
          style={{ width: "15.316%" }}
        />
      </div>
    </div>
  );
}
