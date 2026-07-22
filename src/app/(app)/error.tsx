"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error de render en la app:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl">
        ⚠️
      </div>
      <h2 className="text-lg font-semibold text-zinc-900">No se pudo cargar la página</h2>
      <p className="text-sm text-zinc-600">
        Puede ser una interrupción momentánea de la conexión. Tu trabajo guardado no se
        pierde. Intenta de nuevo.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Reintentar
        </button>
        <a
          href="/dashboard"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Ir al inicio
        </a>
      </div>
      <p className="text-xs text-zinc-400">
        Si &ldquo;Reintentar&rdquo; no funciona, probá un refresco forzado (borra la versión
        guardada en tu navegador):{" "}
        <span className="font-medium text-zinc-500">Ctrl + Shift + R</span> en Windows, o{" "}
        <span className="font-medium text-zinc-500">Cmd + Shift + R</span> en Mac.
      </p>
    </div>
  );
}
