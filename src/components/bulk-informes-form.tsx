"use client";

import { useMemo, useState } from "react";
import type { Student } from "@/lib/types";

function studentName(s: Student) {
  return `${s.primer_apellido} ${s.segundo_apellido ?? ""} ${s.nombre}`.replace(/\s+/g, " ").trim();
}

export function BulkInformesForm({ sectionId, students }: { sectionId: string; students: Student[] }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(students.map((s) => s.id)));
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ generated: number; failed: number } | null>(null);

  const allSelected = useMemo(() => selected.size === students.length, [selected, students]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function generar() {
    setError(null);
    setSummary(null);
    setIsPending(true);
    try {
      const res = await fetch(`/secciones/${sectionId}/informes-masivos/generar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: [...selected] }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "No se pudieron generar los informes.");
        return;
      }
      const generated = Number(res.headers.get("X-Generated-Count") ?? "0");
      const failed = Number(res.headers.get("X-Failed-Count") ?? "0");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `informes-${sectionId.slice(0, 8)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSummary({ generated, failed });
    } catch {
      setError("No se pudieron generar los informes. Verificá tu conexión e intentá de nuevo.");
    } finally {
      setIsPending(false);
    }
  }

  if (students.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-5 py-10 text-center text-sm text-zinc-400">
        No hay estudiantes activos en esta sección.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600">
          {selected.size} de {students.length} seleccionados
        </p>
        <button
          type="button"
          onClick={() =>
            setSelected(allSelected ? new Set() : new Set(students.map((s) => s.id)))
          }
          className="text-xs font-medium text-teal-700 hover:underline"
        >
          {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto rounded-md border border-zinc-300 p-2">
        {students.map((s) => (
          <label key={s.id} className="flex items-center gap-2 py-1 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={selected.has(s.id)}
              onChange={() => toggle(s.id)}
              className="rounded"
            />
            {studentName(s)}
          </label>
        ))}
      </div>

      <button
        type="button"
        disabled={isPending || selected.size === 0}
        onClick={generar}
        className="self-start rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
      >
        {isPending ? "Generando..." : `Generar y descargar ZIP (${selected.size})`}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {summary && (
        <p className="text-sm text-emerald-700">
          Se generaron {summary.generated} informe{summary.generated === 1 ? "" : "s"}.
          {summary.failed > 0 &&
            ` ${summary.failed} no se pudieron generar — revisá errores.txt dentro del ZIP.`}
        </p>
      )}
    </div>
  );
}
