"use client";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#14201c",
          color: "#eef6f2",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>The court is briefly closed</h1>
          <p style={{ color: "#9aafa6", marginTop: 12 }}>
            Something went wrong on our side. Your bids and rankings are safe.
          </p>
          {error.digest && (
            <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: "#9aafa6" }}>
              Ref {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 20,
              border: 0,
              borderRadius: 16,
              background: "#1bb888",
              color: "#fff",
              fontWeight: 700,
              padding: "12px 20px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
