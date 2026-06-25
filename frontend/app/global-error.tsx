'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="antialiased">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '24px',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h1 style={{ fontSize: 48, fontWeight: 700, marginBottom: 16 }}>
            500
          </h1>
          <p style={{ fontSize: 18, color: '#666', marginBottom: 24 }}>
            Terjadi kesalahan pada server
          </p>
          <button
            onClick={reset}
            style={{
              padding: '12px 24px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
