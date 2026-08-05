"use client";

import { useEffect, useRef, useState } from "react";

export function PdfIntroModal({
  title,
  confirmLabel = "Enviar",
  isPending,
  onConfirm,
  onCancel,
}: {
  title: string;
  confirmLabel?: string;
  isPending: boolean;
  onConfirm: (introText: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-intro-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="pdf-intro-modal-title" className="text-sm font-semibold text-zinc-900">
          {title}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Opcional: agregá una nota personalizada que aparecerá al inicio del documento y en el
          correo. Dejala en blanco si no querés agregar nada.
        </p>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Ej: Felicitaciones a Juan por su mejora este periodo..."
          className="mt-3 w-full resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onConfirm(text.trim())}
            className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {isPending ? "Enviando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
