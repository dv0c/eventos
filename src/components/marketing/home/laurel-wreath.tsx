import { cn } from "@/lib/utils";

/** Line-art laurel for the hero “top rated” badge — Kululu-style wreath. */
export function LaurelWreath({
  side = "left",
  className,
}: {
  side?: "left" | "right";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn(
        "h-9 w-7 shrink-0 text-foreground",
        side === "right" && "-scale-x-100",
        className,
      )}
    >
      {/* Stem */}
      <path
        d="M15 38c.5-8 3.5-14.5 8-20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Leaves along the stem */}
      <path
        d="M21.5 19.5c3.2-1.8 6.2-1.2 7.8 1.2-2.2 1.6-5.1 1.8-7.8-1.2Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M20 15.2c3.4-2.2 6.6-1.6 8.2 1-2.4 1.8-5.4 2-8.2-1Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M18.6 11c3.5-2.5 6.8-1.9 8.4.8-2.5 2-5.6 2.2-8.4-.8Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M17.4 7c3.2-2.6 6.4-2.2 7.9.4-2.3 2-5.2 2.4-7.9-.4Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M16.4 3.4c2.6-2.4 5.4-2.4 7-.2-2 1.8-4.6 2.4-7 .2Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      {/* Inner leaf veins */}
      <path
        d="M22.2 20.2c1.6-.4 3-.2 4 .8M20.8 16c1.8-.5 3.3-.2 4.4 1M19.4 11.8c1.9-.6 3.5-.3 4.6 1M18 7.8c1.7-.6 3.2-.4 4.2.8M16.9 4.2c1.4-.5 2.7-.4 3.6.6"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}
