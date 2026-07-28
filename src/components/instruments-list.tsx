"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { duplicateInstrument, setInstrumentEstado } from "@/lib/actions/instruments";
import { TIPO_LABEL, ESTADO_LABEL, ESTADO_BADGE } from "@/lib/instrument-labels";
import type { Instrument, InstrumentEstado, InstrumentTipo } from "@/lib/types";

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");
function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(DIACRITICS_RE, "");
}

// duplicateInstrument termina en redirect(), que lanza un error especial de
// Next que hay que dejar pasar, no tratarlo como una falla real.
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function InstrumentsList({ instruments }: { instruments: Instrument[] }) {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [tipo, setTipo] = useState<string>("");
  const [estado, setEstado] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return instruments.filter((i) => {
      if (tipo && i.tipo !== tipo) return false;
      if (estado && i.estado !== estado) return false;
      if (!q) return true;
      const haystack = normalize(`${i.nombre} ${i.materia ?? ""} ${i.nivel ?? ""}`);
      return haystack.includes(q);
    });
  }, [instruments, query, tipo, estado]);

  function handleDuplicate(id: string) {
    setError(null);
    startTransition(async () => {
      try {
        await duplicateInstrument(id);
      } catch (e) {
        if (isRedirectError(e)) throw e;
        setError(e instanceof Error ? e.message : "No se pudo duplicar.");
      }
    });
  }

  function handleEstado(id: string, next: "borrador" | "activo" | "archivado") {
    setError(null);
    startTransition(() => setInstrumentEstado(id, next));
  }

  return (
    <div className="mt-6">
      {instruments.length > 3 && (
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, materia o nivel..."
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
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex flex-col gap-3">
        {filtered.map((i) => (
          <div
            key={i.id}
            className="rounded-lg border border-zinc-200 bg-white px-5 py-4 shadow-sm hover:border-zinc-400"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <Link href={`/instrumentos/${i.id}`} className="min-w-0 flex-1">
                <p className="font-medium text-zinc-900">
                  {i.nombre}{" "}
                  <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[i.estado as InstrumentEstado]}`}>
                    {ESTADO_LABEL[i.estado as InstrumentEstado]}
                  </span>
                </p>
                <p className="text-sm text-zinc-500">
                  {TIPO_LABEL[i.tipo as InstrumentTipo]}
                  {i.materia ? ` · ${i.materia}` : ""}
                  {i.nivel ? ` · ${i.nivel}` : ""}
                </p>
              </Link>
              <div className="flex shrink-0 gap-3 text-xs">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDuplicate(i.id)}
                  className="font-medium text-zinc-500 hover:text-teal-700 disabled:opacity-50"
                >
                  Duplicar
                </button>
                {i.estado === "archivado" ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleEstado(i.id, "activo")}
                    className="font-medium text-zinc-500 hover:text-teal-700 disabled:opacity-50"
                  >
                    Reactivar
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleEstado(i.id, "archivado")}
                    className="font-medium text-zinc-500 hover:text-red-600 disabled:opacity-50"
                  >
                    Archivar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-300 px-5 py-6 text-center text-sm text-zinc-500">
            {instruments.length === 0
              ? "Todavía no creaste ningún instrumento."
              : "Ningún instrumento coincide con el filtro."}
          </p>
        )}
      </div>
    </div>
  );
}
