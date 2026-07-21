"use client";

import { useRef, useState, useTransition } from "react";
import {
  analyzeImportFile,
  importStudentsFromGrid,
  type ImportPreview,
  type ImportStudentsResult,
} from "@/lib/actions/students";
import { HelpTooltip } from "@/components/help-tooltip";

const FIELD_OPTIONS = [
  { value: "", label: "Ignorar esta columna" },
  { value: "primer_apellido", label: "Primer Apellido *" },
  { value: "segundo_apellido", label: "Segundo Apellido" },
  { value: "nombre", label: "Nombre *" },
  { value: "identificacion", label: "Identificación" },
  { value: "sexo", label: "Sexo" },
  { value: "tipo_apoyo", label: "Tipo de Apoyo" },
];

export function StudentImportForm({ sectionId }: { sectionId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<(string | null)[]>([]);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportStudentsResult | null>(null);

  function handleAnalyze(formData: FormData) {
    setAnalyzeError(null);
    setResult(null);
    startTransition(async () => {
      const res = await analyzeImportFile(null, formData);
      if (res.error || !res.headers) {
        setAnalyzeError(res.error ?? "No se pudo leer el archivo.");
        setPreview(null);
        return;
      }
      setPreview(res);
      setMapping(res.guessedMapping ?? res.headers.map(() => null));
    });
  }

  function handleConfirm() {
    if (!preview?.rows) return;
    startTransition(async () => {
      const res = await importStudentsFromGrid(sectionId, preview.rows!, mapping);
      setResult(res);
      if (res.success) {
        setPreview(null);
        setMapping([]);
        formRef.current?.reset();
      }
    });
  }

  function handleCancel() {
    setPreview(null);
    setMapping([]);
    setAnalyzeError(null);
    formRef.current?.reset();
  }

  const hasRequired = mapping.includes("primer_apellido") && mapping.includes("nombre");
  const previewRows = preview?.rows?.slice(0, 5) ?? [];

  return (
    <div className="max-w-2xl rounded-lg border border-zinc-200 bg-white p-5">
      <h3 className="flex items-center text-sm font-semibold text-zinc-900">
        Importar estudiantes desde Excel/CSV
        <HelpTooltip text='Sube tu archivo y luego indica qué columna corresponde a cada dato (Primer Apellido y Nombre son obligatorios). Los estudiantes se agregan al final de la lista actual, no reemplazan a los existentes.' />
      </h3>

      {!preview && (
        <form ref={formRef} action={handleAnalyze} className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-zinc-600">Archivo (.xlsx o .csv)</label>
            <input
              name="archivo"
              type="file"
              accept=".xlsx,.csv"
              required
              className="mt-1 w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {isPending ? "Analizando..." : "Analizar archivo"}
          </button>
        </form>
      )}

      {analyzeError && <p className="mt-3 text-sm text-red-600">{analyzeError}</p>}

      {preview?.headers && (
        <div className="mt-4">
          <p className="text-xs text-zinc-500">
            Detectamos {preview.headers.length} columna{preview.headers.length === 1 ? "" : "s"} y{" "}
            {preview.rows?.length ?? 0} fila{preview.rows?.length === 1 ? "" : "s"} de datos. Indica
            qué corresponde cada columna:
          </p>

          <div className="mt-3 overflow-x-auto rounded-md border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  {preview.headers.map((h, i) => (
                    <th key={i} className="min-w-[140px] px-2 py-2 text-left align-top">
                      <div className="mb-1 truncate font-normal normal-case text-zinc-400" title={h}>
                        {h || `Columna ${i + 1}`}
                      </div>
                      <select
                        value={mapping[i] ?? ""}
                        onChange={(e) =>
                          setMapping((prev) => {
                            const next = [...prev];
                            next[i] = e.target.value || null;
                            return next;
                          })
                        }
                        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-normal normal-case text-zinc-900"
                      >
                        {FIELD_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {previewRows.map((row, ri) => (
                  <tr key={ri}>
                    {preview.headers!.map((_, ci) => (
                      <td key={ci} className="px-2 py-1.5 text-zinc-600">
                        {row[ci] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(preview.rows?.length ?? 0) > 5 && (
            <p className="mt-1 text-xs text-zinc-400">
              Mostrando las primeras 5 de {preview.rows?.length} filas.
            </p>
          )}

          {!hasRequired && (
            <p className="mt-2 text-xs text-amber-600">
              Debes asignar las columnas &quot;Primer Apellido *&quot; y &quot;Nombre *&quot; antes
              de continuar.
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending || !hasRequired}
              className="rounded-md bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {isPending ? "Importando..." : "Confirmar importación"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="rounded-md px-4 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              Elegir otro archivo
            </button>
          </div>
        </div>
      )}

      {result?.error && <p className="mt-3 text-sm text-red-600">{result.error}</p>}
      {result?.success && (
        <p className="mt-3 text-sm text-emerald-600">
          Se importaron {result.imported} estudiante{result.imported === 1 ? "" : "s"}.
          {result.skipped
            ? ` Se omitieron ${result.skipped} fila${result.skipped === 1 ? "" : "s"} sin Primer Apellido o Nombre.`
            : ""}
        </p>
      )}
    </div>
  );
}
