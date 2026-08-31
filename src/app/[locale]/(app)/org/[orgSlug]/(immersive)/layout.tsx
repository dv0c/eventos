import { ImmersiveShell } from "@/components/layout/immersive-shell";

export default function NewEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ImmersiveShell>{children}</ImmersiveShell>;
}
