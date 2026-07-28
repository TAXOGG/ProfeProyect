"use client";

import { useRef, useState, useTransition } from "react";
import {
  analyzeImportFile,
  importStudentsFromGrid,
  type DuplicateMode,
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

function downloadSkippedRowsCsv(skippedRows: { fila: number; motivo: string }[]) {
  const header = "Fila,Motivo\n";
  const body = skippedRows
    .map((r) => `${r.fila},"${r.motivo.replace(/"/g, '""')}"`)
    .join("\n");
  const blob = new Blob([`${header}${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "errores-importacion.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function StudentImportForm({ sectionId }: { sectionId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[] | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<(string | null)[]>([]);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [duplicateCount, setDuplicateCount] = useState<number | null>(null);
  const [result, setResult] = useState<ImportStudentsResult | null>(null);

  function handleAnalyze(formData: FormData) {
    const file = formData.get("archivo");
    setSelectedFile(file instanceof File ? file : null);
    setAnalyzeError(null);
    setResult(null);
    setPreview(null);
    setSheetNames(null);
    setDuplicateCount(null);
    startTransition(async () => {
      const res = await analyzeImportFile(null, formData);
      if (res.error) {
        setAnalyzeError(res.error);
        return;
      }
      if (res.sheets) {
        // El archivo tiene varias hojas (ej. una por sección): hay que
        // elegir cuál corresponde antes de poder mapear columnas.
        setSheetNames(res.sheets);
        return;
      }
      if (!res.headers) {
        setAnalyzeError("No se pudo leer el archivo.");
        return;
      }
      setPreview(res);
      setMapping(res.guessedMapping ?? res.headers.map(() => null));
    });
  }

  function handlePickSheet(hoja: string) {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.set("archivo", selectedFile);
    formData.set("hoja", hoja);
    setAnalyzeError(null);
    startTransition(async () => {
      const res = await analyzeImportFile(null, formData);
      if (res.error || !res.headers) {
        setAnalyzeError(res.error ?? "No se pudo leer esa hoja.");
        return;
      }
      setPreview(res);
      setMapping(res.guessedMapping ?? res.headers.map(() => null));
    });
  }

  function runImport(duplicateMode?: DuplicateMode) {
    if (!preview?.rows) return;
    startTransition(async () => {
      const res = await importStudentsFromGrid(sectionId, preview.rows!, mapping, duplicateMode);
      if (res.duplicates) {
        // Todavía no se decidió qué hacer con los duplicados detectados.
        setDuplicateCount(res.duplicates);
        return;
      }
      setDuplicateCount(null);
      setResult(res);
      if (res.success) {
        setPreview(null);
        setMapping([]);
        setSheetNames(null);
        setSelectedFile(null);
        formRef.current?.reset();
      }
    });
  }

  // Vuelve al listado de hojas sin tener que releer el archivo del disco.
  function handleBackToSheets() {
    setPreview(null);
    setMapping([]);
    setAnalyzeError(null);
    setResult(null);
    setDuplicateCount(null);
  }

  function handleCancel() {
    setPreview(null);
    setMapping([]);
    setAnalyzeError(null);
    setSheetNames(null);
    setSelectedFile(null);
    setDuplicateCount(null);
    formRef.current?.reset();
  }

  const hasRequired = mapping.includes("primer_apellido") && mapping.includes("nombre");
  const previewRows = preview?.rows?.slice(0, 5) ?? [];

  return (
    <div className="max-w-2xl rounded-lg border border-zinc-200 bg-white p-5">
      <h3 className="flex items-center text-sm font-semibold text-zinc-900">
        Importar estudiantes desde Excel/CSV
        <HelpTooltip text='Sube tu archivo y luego indica qué columna corresponde a cada dato (Primer Apellido y Nombre son obligatorios). Si el Excel trae varias hojas (una por sección), primero elegís cuál importar aquí. Los estudiantes nuevos quedan en mayúsculas y la lista completa queda reordenada alfabéticamente por apellido. Si alguna fila coincide con un estudiante que ya existe (misma identificación o mismo nombre), te preguntamos qué hacer antes de importar.' />
      </h3>

      {!preview && !sheetNames && (
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

      {sheetNames && !preview && (
        <div className="mt-4">
          <p className="text-sm text-zinc-700">
            El archivo tiene {sheetNames.length} hojas. Elegí cuál corresponde a esta sección:
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {sheetNames.map((name) => (
              <button
                key={name}
                type="button"
                disabled={isPending}
                onClick={() => handlePickSheet(name)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-teal-600 hover:text-teal-700 disabled:opacity-60"
              >
                {name}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="mt-3 text-xs text-zinc-500 underline hover:text-zinc-800"
          >
            Elegir otro archivo
          </button>
        </div>
      )}

      {preview?.headers && duplicateCount === null && (
        <div className="mt-4">
          <p className="text-xs text-zinc-500">
            {preview.sheetName && (
              <>
                Hoja <strong>{preview.sheetName}</strong> ·{" "}
              </>
            )}
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

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runImport()}
              disabled={isPending || !hasRequired}
              className="rounded-md bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {isPending ? "Importando..." : "Confirmar importación"}
            </button>
            {sheetNames && sheetNames.length > 1 && (
              <button
                type="button"
                onClick={handleBackToSheets}
                disabled={isPending}
                className="rounded-md px-4 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
              >
                ‹ Elegir otra hoja
              </button>
            )}
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

      {duplicateCount !== null && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            Encontramos {duplicateCount} estudiante{duplicateCount === 1 ? "" : "s"} en el archivo
            que ya podría{duplicateCount === 1 ? "" : "n"} estar en esta sección (misma
            identificación o mismo nombre completo). ¿Qué querés hacer con esas filas?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => runImport("omitir")}
              className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
            >
              Omitir duplicados
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => runImport("actualizar")}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
            >
              Actualizar sus datos
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => runImport("nuevo")}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
            >
              Importar como nuevos de todas formas
            </button>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setDuplicateCount(null)}
            className="mt-2 text-xs text-zinc-500 underline hover:text-zinc-800"
          >
            Cancelar y revisar el mapeo de columnas
          </button>
        </div>
      )}

      {result?.error && <p className="mt-3 text-sm text-red-600">{result.error}</p>}
      {result?.success && (
        <div className="mt-3 text-sm text-emerald-600">
          <p>
            Se importaron {result.imported} estudiante{result.imported === 1 ? "" : "s"}
            {result.updated
              ? ` y se actualizaron ${result.updated} ya existente${result.updated === 1 ? "" : "s"}`
              : ""}
            .
            {result.skipped
              ? ` Se omitieron ${result.skipped} fila${result.skipped === 1 ? "" : "s"}.`
              : ""}
          </p>
          {result.skippedRows && (
            <button
              type="button"
              onClick={() => downloadSkippedRowsCsv(result.skippedRows!)}
              className="mt-1 text-xs font-medium text-teal-700 underline hover:text-teal-800"
            >
              Descargar detalle de filas omitidas (CSV)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
