"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TIPO_LABEL, MEDIO_LABEL, ESTADO_LABEL, ESTADO_BADGE } from "@/lib/communication-labels";
import type { Communication } from "@/lib/types";

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");
function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(DIACRITICS_RE, "");
}

type Row = Communication & { studentName: string };

export function ComunicacionesList({ sectionId, rows }: { sectionId: string; rows: Row[] }) {
  const [query, setQuery] = useState("");
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return rows.filter((r) => {
      if (estado && r.estado !== estado) return false;
      if (tipo && r.tipo !== tipo) return false;
      if (!q) return true;
      return normalize(`${r.studentName} ${TIPO_LABEL[r.tipo]} ${r.mensaje}`).includes(q);
    });
  }, [rows, query, tipo, estado]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por estudiante, tipo o mensaje..."
          className="min-w-[180px] flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm placeholder:text-zinc-500"
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {filtered.map((r) => (
          <Link
            key={r.id}
            href={`/secciones/${sectionId}/comunicaciones/${r.id}`}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-400"
          >
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-900">
              {r.studentName} · {TIPO_LABEL[r.tipo]}
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[r.estado]}`}>
                {ESTADO_LABEL[r.estado]}
              </span>
            </p>
            <p className="mt-0.5 truncate text-xs text-zinc-500">{r.mensaje}</p>
            <p className="mt-0.5 text-xs text-zinc-400">
              {MEDIO_LABEL[r.medio]} · {r.fecha_realizada ?? r.created_at.slice(0, 10)}
            </p>
          </Link>
        ))}

        {filtered.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-300 px-5 py-6 text-center text-sm text-zinc-500">
            {rows.length === 0
              ? "Todavía no preparaste ninguna comunicación en esta sección."
              : "Ninguna comunicación coincide con el filtro."}
          </p>
        )}
      </div>
    </div>
  );
}
