"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { submitFeedback, type FeedbackCategoria } from "@/lib/actions/feedback";

const CATEGORIES: {
  value: FeedbackCategoria;
  label: string;
  icon: string;
  hint: string;
  placeholder: string;
}[] = [
  {
    value: "error",
    label: "Encontré un error",
    icon: "🐞",
    hint: "Cuéntanos qué intentabas hacer y qué pasó en vez de lo esperado.",
    placeholder: "Ej: al guardar una nota en Cotidiano, la pantalla se quedó cargando...",
  },
  {
    value: "sugerencia",
    label: "Tengo una sugerencia",
    icon: "💡",
    hint: "¿Qué te gustaría que ARCE hiciera o mejorara?",
    placeholder: "Ej: sería útil poder exportar la lista de estudiantes a Excel...",
  },
  {
    value: "duda",
    label: "No entiendo cómo usar esto",
    icon: "❓",
    hint: "¿Qué parte de la pantalla te confunde? Entre más detalle, mejor te podemos ayudar.",
    placeholder: "Ej: no sé para qué sirve la tolerancia en Ajustes...",
  },
  {
    value: "otro",
    label: "Otro comentario",
    icon: "💬",
    hint: "Cuéntanos lo que quieras — toda retroalimentación ayuda mientras probamos ARCE.",
    placeholder: "Escribe aquí...",
  },
];

export function FeedbackBubble() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategoria | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sectionId = pathname.match(/^\/secciones\/([^/]+)/)?.[1] ?? null;
  const selected = CATEGORIES.find((c) => c.value === category);

  function reset() {
    setCategory(null);
    setMensaje("");
    setSent(false);
    setError(null);
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 200);
  }

  return (
    <div className="no-print fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-200 bg-white p-4 shadow-lg">
          {sent ? (
            <div className="py-2 text-center">
              <p className="text-2xl">✓</p>
              <p className="mt-2 text-sm font-medium text-zinc-900">¡Gracias por tu feedback!</p>
              <p className="mt-1 text-xs text-zinc-500">
                Nos ayuda a mejorar ARCE mientras lo probamos contigo.
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-3 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cerrar
              </button>
            </div>
          ) : !category ? (
            <>
              <p className="text-sm font-semibold text-zinc-900">¿En qué te ayudamos?</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                ARCE aún está en pruebas — tu feedback es clave.
              </p>
              <div className="mt-3 flex flex-col gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-left text-sm text-zinc-700 hover:border-teal-300 hover:bg-teal-50"
                  >
                    <span aria-hidden>{c.icon}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCategory(null)}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                ← volver
              </button>
              <p className="mt-1.5 text-sm font-semibold text-zinc-900">
                {selected?.icon} {selected?.label}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{selected?.hint}</p>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder={selected?.placeholder}
                rows={4}
                className="mt-2 w-full resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400"
              />
              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const result = await submitFeedback({
                        categoria: category,
                        mensaje,
                        ruta: pathname,
                        sectionId,
                      });
                      if (result.success) {
                        setSent(true);
                      } else {
                        setError(result.error ?? "No se pudo enviar.");
                      }
                    });
                  }}
                  className="rounded-md bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  {isPending ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={open ? "Cerrar feedback" : "Enviar feedback o pedir ayuda"}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-700 text-xl text-white shadow-lg hover:bg-teal-800"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
