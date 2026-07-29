"use client";

import { useState } from "react";
import { resolveObservationText, type ObservationContext } from "@/lib/observation-variables";
import type { ObservationTemplate } from "@/lib/types";

export function ObservationPicker({
  observations,
  context,
  onInsert,
  label = "Insertar observación guardada",
}: {
  observations: ObservationTemplate[];
  context: ObservationContext;
  onInsert: (text: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (observations.length === 0) return null;

  function handlePick(o: ObservationTemplate) {
    const { resolved, missing } = resolveObservationText(o.texto, context);
    if (missing.length > 0) {
      setError(
        `Esa observación usa ${missing.map((m) => `{{${m}}}`).join(", ")}, que no está disponible acá.`,
      );
      return;
    }
    setError(null);
    onInsert(resolved);
    setOpen(false);
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-medium text-teal-700 hover:underline"
      >
        {label}
      </button>

      {open && (
        <div
          className="absolute z-10 mt-1 max-h-64 w-72 overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          {observations.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => handlePick(o)}
              className="block w-full border-b border-zinc-50 px-3 py-2 text-left text-xs text-zinc-700 last:border-0 hover:bg-zinc-50"
            >
              {o.texto.length > 90 ? `${o.texto.slice(0, 90)}…` : o.texto}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
