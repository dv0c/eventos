import { Logo } from "@/components/shared/logo";

interface AuthGlassPanelProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  showLogo?: boolean;
}

export function AuthGlassPanel({
  title,
  subtitle,
  children,
  showLogo = true,
}: AuthGlassPanelProps) {
  return (
    <div className="glass-panel w-full space-y-6 border-white/15 bg-black/45 p-6 backdrop-blur-xl sm:p-8">
      <header className="space-y-2 text-center">
        {showLogo ? (
          <div className="mx-auto mb-4 flex justify-center">
            <Logo variant="mark" size="lg" />
          </div>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </header>
      {children}
    </div>
  );
}
