"use client";

import { useMemo, useState } from "react";
import { ArchivedSectionRow } from "@/components/archived-section-row";
import type { SectionWithInstitution } from "@/lib/types";

export function ArchivedSectionsFilterList({ sections }: { sections: SectionWithInstitution[] }) {
  const [nivel, setNivel] = useState("");
  const [ciclo, setCiclo] = useState("");

  const niveles = useMemo(() => [...new Set(sections.map((s) => s.nivel))].sort(), [sections]);
  const ciclos = useMemo(
    () => [...new Set(sections.map((s) => s.ciclo_escolar))].sort((a, b) => b - a),
    [sections],
  );

  const filtered = useMemo(
    () =>
      sections.filter((s) => {
        if (nivel && s.nivel !== nivel) return false;
        if (ciclo && String(s.ciclo_escolar) !== ciclo) return false;
        return true;
      }),
    [sections, nivel, ciclo],
  );

  return (
    <div className="mt-6 flex flex-col gap-3">
      {sections.length > 3 && (
        <div className="flex flex-wrap gap-2">
          <select
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">Todos los niveles</option>
            {niveles.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <select
            value={ciclo}
            onChange={(e) => setCiclo(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">Todos los ciclos</option>
            {ciclos.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {filtered.map((s) => (
        <ArchivedSectionRow key={s.id} section={s} />
      ))}

      {filtered.length === 0 && (
        <p className="rounded-lg border border-dashed border-zinc-300 px-5 py-6 text-center text-sm text-zinc-500">
          {sections.length === 0
            ? "No tienes secciones archivadas."
            : "Ninguna sección coincide con el filtro."}
        </p>
      )}
    </div>
  );
}
