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
        <p style={{ marginTop: "1.5rem", fontSize: "0.8rem", color: "#71717a" }}>
          Si sigue sin cargar, probá un refresco forzado (borra la versión guardada en tu
          navegador): Ctrl + Shift + R en Windows, o Cmd + Shift + R en Mac.
        </p>
      </body>
    </html>
  );
}
