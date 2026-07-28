"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SupportRecord } from "@/lib/types";

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");
function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(DIACRITICS_RE, "");
}

type Row = SupportRecord & { studentName: string };

export function SupportRecordsList({ sectionId, records }: { sectionId: string; records: Row[] }) {
  const [query, setQuery] = useState("");
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("activo");

  const tipos = useMemo(() => [...new Set(records.map((r) => r.tipo_apoyo))].sort(), [records]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return records.filter((r) => {
      if (estado && r.estado !== estado) return false;
      if (tipo && r.tipo_apoyo !== tipo) return false;
      if (!q) return true;
      return normalize(`${r.studentName} ${r.tipo_apoyo} ${r.descripcion}`).includes(q);
    });
  }, [records, query, tipo, estado]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por estudiante, tipo o descripción..."
          className="min-w-[180px] flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm placeholder:text-zinc-500"
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">Todos los tipos</option>
          {tipos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="activo">Activos</option>
          <option value="archivado">Archivados</option>
          <option value="">Todos</option>
        </select>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {filtered.map((r) => (
          <Link
            key={r.id}
            href={`/secciones/${sectionId}/apoyos/${r.id}`}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-400"
          >
            <p className="text-sm font-medium text-zinc-900">
              {r.studentName} · {r.tipo_apoyo}
              {r.seguimiento_requerido && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  seguimiento
                </span>
              )}
            </p>
            <p className="mt-0.5 truncate text-xs text-zinc-500">{r.descripcion}</p>
            <p className="mt-0.5 text-xs text-zinc-400">{r.fecha}</p>
          </Link>
        ))}

        {filtered.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-300 px-5 py-6 text-center text-sm text-zinc-500">
            {records.length === 0
              ? "Todavía no registraste ningún apoyo en esta sección."
              : "Ningún registro coincide con el filtro."}
          </p>
        )}
      </div>
    </div>
  );
}
