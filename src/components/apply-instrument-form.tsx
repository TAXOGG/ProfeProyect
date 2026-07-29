"use client";

import { useMemo, useState } from "react";
import { applyInstrument } from "@/lib/actions/instruments";
import type { InstrumentTipo } from "@/lib/types";

type SectionOption = {
  id: string;
  label: string;
  periods: { id: string; nombre: string; estado: string }[];
};

const RUBRO_LABEL: Record<string, string> = {
  cotidiano: "Trabajo Cotidiano (nuevo Indicador)",
  pruebas: "Pruebas (nueva Prueba)",
  tareas: "Tareas (nueva Tarea)",
  proyecto: "Proyecto (nueva Etapa)",
};

export function ApplyInstrumentForm({
  instrumentId,
  tipo,
  sections,
}: {
  instrumentId: string;
  tipo: InstrumentTipo;
  sections: SectionOption[];
}) {
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const generaNota = tipo !== "registro_anecdotico";

  const periods = useMemo(
    () => sections.find((s) => s.id === sectionId)?.periods ?? [],
    [sections, sectionId],
  );

  if (sections.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-5 py-6 text-center text-sm text-zinc-500">
        Todavía no tenés secciones activas para aplicar un instrumento.
      </p>
    );
  }

  return (
    <form action={applyInstrument.bind(null, instrumentId)} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700">Sección</label>
        <select
          name="section_id"
          value={sectionId}
          onChange={(e) => setSectionId(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Periodo</label>
        <select
          name="period_id"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          {periods.map((p) => (
            <option key={p.id} value={p.id} disabled={p.estado === "cerrado"}>
              {p.nombre}
              {p.estado === "cerrado" ? " (cerrado)" : ""}
            </option>
          ))}
        </select>
      </div>

      {generaNota && (
        <div>
          <label className="block text-sm font-medium text-zinc-700">La nota va a ir a</label>
          <select
            name="rubro_destino"
            required
            defaultValue=""
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Selecciona un rubro
            </option>
            {Object.entries(RUBRO_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-400">
            Se crea automáticamente con el nombre del instrumento, en la misma escala de puntos.
            {" "}Si es una Prueba, se crea con peso 0% — andá a Pruebas después de aplicar y
            asignale el peso real para que cuente en la nota del periodo.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700">Fecha</label>
        <input
          name="fecha"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        className="mt-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
      >
        Aplicar
      </button>
    </form>
  );
}
