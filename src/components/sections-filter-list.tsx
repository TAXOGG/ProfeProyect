"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SectionCardActions } from "@/components/section-card-actions";
import type { SectionWithInstitution } from "@/lib/types";

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(DIACRITICS_RE, "");
}

export function SectionsFilterList({ sections }: { sections: SectionWithInstitution[] }) {
  const [query, setQuery] = useState("");
  const [nivel, setNivel] = useState("");
  const [ciclo, setCiclo] = useState("");

  const niveles = useMemo(
    () => [...new Set(sections.map((s) => s.nivel))].sort(),
    [sections],
  );
  const ciclos = useMemo(
    () => [...new Set(sections.map((s) => s.ciclo_escolar))].sort((a, b) => b - a),
    [sections],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return sections.filter((s) => {
      if (nivel && s.nivel !== nivel) return false;
      if (ciclo && String(s.ciclo_escolar) !== ciclo) return false;
      if (!q) return true;
      const haystack = normalize(`${s.asignatura} ${s.nombre} ${s.institutionNombre}`);
      return haystack.includes(q);
    });
  }, [sections, query, nivel, ciclo]);

  const hasFilters = query || nivel || ciclo;

  return (
    <div className="mt-6 flex flex-col gap-3">
      {sections.length > 3 && (
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por asignatura, sección o institución..."
            className="min-w-[180px] flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm placeholder:text-zinc-500"
          />
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
        <div
          key={s.id}
          className="rounded-lg border border-zinc-200 bg-white px-5 py-4 shadow-sm hover:border-zinc-400"
        >
          <Link href={`/secciones/${s.id}/estudiantes`} className="block">
            <p className="font-medium text-zinc-900">
              {s.asignatura} — {s.nombre}
            </p>
            <p className="text-sm text-zinc-500">
              {s.institutionNombre} · {s.nivel} · Ciclo {s.ciclo_escolar}
            </p>
          </Link>
          <div className="mt-2 border-t border-zinc-100 pt-2">
            <SectionCardActions
              sectionId={s.id}
              sectionLabel={`${s.asignatura} — ${s.nombre}`}
            />
          </div>
        </div>
      ))}

      {filtered.length === 0 && sections.length > 0 && (
        <p className="rounded-lg border border-dashed border-zinc-300 px-5 py-6 text-center text-sm text-zinc-500">
          {hasFilters
            ? "Ninguna sección coincide con el filtro."
            : "Aún no tienes secciones registradas."}
        </p>
      )}

      {sections.length === 0 && (
        <p className="rounded-lg border border-dashed border-zinc-300 px-5 py-6 text-center text-sm text-zinc-500">
          Aún no tienes secciones registradas.
        </p>
      )}
    </div>
  );
}
