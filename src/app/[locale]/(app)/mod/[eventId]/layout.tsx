import { mobileAppViewport } from "@/lib/mobile-app-viewport";

export const viewport = mobileAppViewport;

export default function ModeratorAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
