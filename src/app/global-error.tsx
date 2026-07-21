"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", textAlign: "center" }}>
        <h2>No se pudo cargar ARCE</h2>
        <p>Verifica tu conexión e intenta de nuevo.</p>
        <button onClick={reset} style={{ padding: "0.5rem 1rem", marginTop: "1rem" }}>
          Reintentar
        </button>
      </body>
    </html>
  );
}
