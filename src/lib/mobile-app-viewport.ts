import type { Viewport } from "next";

/** App-like viewport: no pinch/double-tap zoom. Use only on album + mod routes. */
export const mobileAppViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};
