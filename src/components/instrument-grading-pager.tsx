"use client";

import { useMemo, useState, useTransition } from "react";
import { saveInstrumentResult } from "@/lib/actions/instruments";
import { ObservationPicker } from "@/components/observation-picker";
import { UploadPhotoForm } from "@/components/upload-photo-form";
import { PhotoGallery } from "@/components/photo-gallery";
import type { ObservationContext } from "@/lib/observation-variables";
import type {
  InstrumentCriterio,
  InstrumentNivel,
  InstrumentResult,
  InstrumentTipo,
  ObservationTemplate,
  Student,
  StudentPhoto,
} from "@/lib/types";

type StudentState = {
  resultId: string | null;
  criterioScores: Record<string, string>;
  observacion: string;
  estado: "borrador" | "completado";
};

type PhotoWithUrl = StudentPhoto & { url: string | null };

function studentName(s: Student) {
  return `${s.primer_apellido} ${s.segundo_apellido ?? ""} ${s.nombre}`.replace(/\s+/g, " ").trim();
}

export function InstrumentGradingPager({
  sectionId,
  applicationId,
  tipo,
  criteria,
  levels,
  students,
  initialResults,
  observations,
  observationContext,
  evidenceByResultId,
}: {
  sectionId: string;
  applicationId: string;
  tipo: InstrumentTipo;
  criteria: InstrumentCriterio[];
  levels: InstrumentNivel[];
  students: Student[];
  initialResults: InstrumentResult[];
  observations: ObservationTemplate[];
  observationContext: Omit<ObservationContext, "nombre_estudiante">;
  evidenceByResultId: Record<string, PhotoWithUrl[]>;
}) {
  const [isPending, startTransition] = useTransition();
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [savedFlag, setSavedFlag] = useState(false);
  const [state, setState] = useState<Record<string, StudentState>>(() => {
    const map: Record<string, StudentState> = {};
    for (const r of initialResults) {
      map[r.student_id] = {
        resultId: r.id,
        criterioScores: r.criterio_scores ?? {},
        observacion: r.observacion ?? "",
        estado: r.estado,
      };
    }
    return map;
  });

  const generaNota = tipo !== "registro_anecdotico";
  const puntajeTotal = useMemo(() => {
    let total = 0;
    for (const c of criteria) {
      const max = Math.max(0, ...levels.filter((l) => l.criterio_id === c.id).map((l) => l.puntaje));
      total += max;
    }
    return total;
  }, [criteria, levels]);

  if (students.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-5 py-10 text-center text-sm text-zinc-400">
        No hay estudiantes activos en esta sección.
      </p>
    );
  }

  const student = students[Math.min(index, students.length - 1)];
  const current: StudentState = state[student.id] ?? {
    resultId: null,
    criterioScores: {},
    observacion: "",
    estado: "borrador",
  };

  const puntajeActual = generaNota
    ? Object.values(current.criterioScores).reduce((sum, nivelId) => {
        const nivel = levels.find((l) => l.id === nivelId);
        return sum + (nivel?.puntaje ?? 0);
      }, 0)
    : null;

  const completados = Object.values(state).filter((s) => s.estado === "completado").length;

  function persist(next: StudentState, finalize: boolean) {
    setError(null);
    setSavedFlag(false);
    const studentId = student.id;
    setState((prev) => ({ ...prev, [studentId]: next }));
    startTransition(async () => {
      try {
        const { id } = await saveInstrumentResult(applicationId, studentId, {
          criterioScores: next.criterioScores,
          observacion: next.observacion,
          finalize,
        });
        setState((prev) => ({
          ...prev,
          [studentId]: { ...(prev[studentId] ?? next), resultId: id },
        }));
        setSavedFlag(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar.");
      }
    });
  }

  function pickNivel(criterioId: string, nivelId: string) {
    const next: StudentState = {
      ...current,
      criterioScores: { ...current.criterioScores, [criterioId]: nivelId },
    };
    persist(next, false);
  }

  function updateObservacion(value: string) {
    setState((prev) => ({ ...prev, [student.id]: { ...current, observacion: value } }));
  }

  function saveObservacionBlur() {
    persist(current, current.estado === "completado");
  }

  function complete() {
    persist(current, true);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          aria-label="Estudiante anterior"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-lg text-zinc-600 disabled:opacity-30"
        >
          ‹
        </button>
        <select
          value={student.id}
          onChange={(e) => setIndex(students.findIndex((s) => s.id === e.target.value))}
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm font-medium text-zinc-900"
        >
          {students.map((s, i) => (
            <option key={s.id} value={s.id}>
              {i + 1}. {studentName(s)} {state[s.id]?.estado === "completado" ? "✓" : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={index === students.length - 1}
          onClick={() => setIndex((i) => Math.min(students.length - 1, i + 1))}
          aria-label="Siguiente estudiante"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-lg text-zinc-600 disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <p className="mt-2 text-center text-xs text-zinc-400">
        {index + 1} de {students.length} · {completados} completado{completados === 1 ? "" : "s"}
      </p>

      {generaNota && (
        <div className="mt-4 flex flex-col gap-4">
          {criteria.map((c) => (
            <div key={c.id}>
              {criteria.length > 1 && (
                <p className="text-sm font-medium text-zinc-800">{c.descripcion}</p>
              )}
              <div className="mt-1.5 flex flex-wrap gap-2">
                {levels
                  .filter((l) => l.criterio_id === c.id)
                  .map((l) => {
                    const selected = current.criterioScores[c.id] === l.id;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        disabled={isPending}
                        onClick={() => pickNivel(c.id, l.id)}
                        title={l.descripcion ?? ""}
                        className={`rounded-md border px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
                          selected
                            ? "border-teal-600 bg-teal-50 font-medium text-teal-800"
                            : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {l.nombre} <span className="text-xs text-zinc-400">({l.puntaje})</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}

          <p className="text-sm text-zinc-600">
            Puntaje: <strong>{puntajeActual}</strong> / {puntajeTotal}
          </p>
        </div>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-zinc-600">Observación (opcional)</label>
          <ObservationPicker
            observations={observations}
            context={{ ...observationContext, nombre_estudiante: studentName(student) }}
            onInsert={(text) => {
              const next: StudentState = {
                ...current,
                observacion: current.observacion ? `${current.observacion} ${text}` : text,
              };
              setState((prev) => ({ ...prev, [student.id]: next }));
            }}
          />
        </div>
        <textarea
          rows={2}
          value={current.observacion}
          onChange={(e) => updateObservacion(e.target.value)}
          onBlur={saveObservacionBlur}
          placeholder="Nota para vos o para el expediente del estudiante"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400"
        />
      </div>

      <div className="mt-4 border-t border-zinc-100 pt-3">
        <label className="block text-xs font-medium text-zinc-600">Evidencia</label>
        {current.resultId ? (
          <div className="mt-1.5 flex flex-col gap-2">
            <PhotoGallery
              sectionId={sectionId}
              studentId={student.id}
              photos={evidenceByResultId[current.resultId] ?? []}
            />
            <UploadPhotoForm
              sectionId={sectionId}
              studentId={student.id}
              instrumentResultId={current.resultId}
              compact
            />
          </div>
        ) : (
          <p className="mt-1 text-xs text-zinc-400">
            Elegí un nivel o escribí una observación para poder adjuntar evidencia.
          </p>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {!error && savedFlag && <p className="mt-2 text-xs text-emerald-600">Guardado.</p>}

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-400">
          {current.estado === "completado" ? "Completado" : "Borrador"}
        </span>
        <button
          type="button"
          disabled={isPending || current.estado === "completado"}
          onClick={complete}
          className="rounded-md bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Completar"}
        </button>
      </div>
    </div>
  );
}
