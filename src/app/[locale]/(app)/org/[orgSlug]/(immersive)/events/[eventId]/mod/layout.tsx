import { mobileAppViewport } from "@/lib/mobile-app-viewport";

export const viewport = mobileAppViewport;

export default function EventModeratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
