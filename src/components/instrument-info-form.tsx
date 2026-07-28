"use client";

import { useState, useTransition } from "react";
import { updateInstrumentInfo, setInstrumentEstado } from "@/lib/actions/instruments";
import type { Instrument } from "@/lib/types";

export function InstrumentInfoForm({ instrument }: { instrument: Instrument }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <form
        action={(formData) => {
          setError(null);
          setSaved(false);
          startTransition(async () => {
            try {
              await updateInstrumentInfo(instrument.id, formData);
              setSaved(true);
            } catch (e) {
              setError(e instanceof Error ? e.message : "No se pudo guardar.");
            }
          });
        }}
        className="flex flex-col gap-3"
      >
        <div>
          <label className="block text-xs font-medium text-zinc-600">Nombre</label>
          <input
            name="nombre"
            required
            defaultValue={instrument.nombre}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600">Materia</label>
            <input
              name="materia"
              defaultValue={instrument.materia ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Nivel</label>
            <input
              name="nivel"
              defaultValue={instrument.nivel ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600">Descripción</label>
          <textarea
            name="descripcion"
            rows={2}
            defaultValue={instrument.descripcion ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600">
            Instrucciones para quien lo aplica
          </label>
          <textarea
            name="instrucciones"
            rows={2}
            placeholder="Ej: leer en voz alta cada criterio antes de calificar"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && !error && <p className="text-sm text-emerald-600">Guardado.</p>}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {isPending ? "Guardando..." : "Guardar cambios"}
          </button>

          {instrument.estado === "archivado" ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => setInstrumentEstado(instrument.id, "activo"))}
              className="text-xs font-medium text-teal-700 hover:underline disabled:opacity-50"
            >
              Reactivar
            </button>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => setInstrumentEstado(instrument.id, "archivado"))}
              className="text-xs font-medium text-red-500 hover:underline disabled:opacity-50"
            >
              Archivar instrumento
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
