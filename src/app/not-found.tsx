import Link from "next/link";

/** Root fallback when locale context is unavailable (e.g. unmatched top-level routes). */
export default function RootNotFoundPage() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          background:
            "radial-gradient(ellipse at top, rgba(201,162,39,0.12), transparent 55%), radial-gradient(ellipse at bottom, rgba(139,115,85,0.08), transparent 50%), #faf8f4",
          color: "#1f1a14",
        }}
      >
        <main style={{ textAlign: "center", padding: 24, maxWidth: 420 }}>
          <p
            style={{
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              opacity: 0.7,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            404
          </p>
          <h1 style={{ fontSize: 28, margin: "8px 0", fontWeight: 700 }}>Page not found</h1>
          <p style={{ opacity: 0.75, marginBottom: 24, lineHeight: 1.5 }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link
            href="/en/dashboard"
            style={{
              display: "inline-block",
              padding: "10px 18px",
              borderRadius: 12,
              background: "#c9a227",
              color: "#1f1a14",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Go to dashboard
          </Link>
        </main>
      </body>
    </html>
  );
}
