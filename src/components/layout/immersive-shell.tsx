"use client";

interface ImmersiveShellProps {
  children: React.ReactNode;
}

export function ImmersiveShell({ children }: ImmersiveShellProps) {
  return (
    <div className="h-dvh overflow-hidden bg-background">
      {children}
    </div>
  );
}
