"use client";

import { useCallback, useEffect } from "react";
import { upsertExamScore } from "@/lib/actions/exams";
import { useThresholdGrid } from "@/lib/use-threshold-grid";
import { ConfirmModal } from "@/components/confirm-modal";
import { db } from "@/lib/offline/db";
import { enqueueAction, pullPruebasData } from "@/lib/offline/sync-engine";
import { moduleColor } from "@/lib/module-colors";
import { SendRubroReportButton } from "@/components/send-rubro-report-button";
import type { Exam, ExamScore, Student } from "@/lib/types";

export function PruebasGrid({
  sectionId,
  students,
  exams,
  scores,
  pruebasPct,
  tolerancePct,
}: {
  sectionId: string;
  students: Student[];
  exams: Exam[];
  scores: ExamScore[];
  pruebasPct: number;
  tolerancePct: number;
}) {
  const initialValues = Object.fromEntries(
    scores.map((s) => [`${s.exam_id}:${s.student_id}`, s.puntos_obtenidos]),
  );

  useEffect(() => {
    if (navigator.onLine) pullPruebasData(sectionId).catch(() => {});
  }, [sectionId]);

  const onPersist = useCallback(
    async (examId: string, studentId: string, value: number) => {
      if (navigator.onLine) {
        try {
          await upsertExamScore(sectionId, examId, studentId, value);
          return;
        } catch {
          // wifi intermitente: cae al camino offline igual
        }
      }
      await db.examScores.put({ exam_id: examId, student_id: studentId, puntos_obtenidos: value });
      await enqueueAction("pruebas.upsertExamScore", [sectionId, examId, studentId, value], sectionId);
    },
    [sectionId],
  );

  const {
    isPending,
    getValue,
    handleChange,
    handleBlur,
    pending,
    confirmPending,
    cancelPending,
    isSaved,
    applyToAll,
  } = useThresholdGrid({
    initialValues,
    tolerancePct,
    onPersist,
  });

  const examenPendiente = pending ? exams.find((e) => e.id === pending.itemId) : undefined;

  if (exams.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-5 py-10 text-center text-sm text-zinc-400">
        Agrega al menos una prueba para poder registrar puntos.
      </p>
    );
  }

  const color = moduleColor("pruebas");

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="sticky left-0 bg-zinc-50 px-4 py-2 text-left">Estudiante</th>
            {exams.map((e) => (
              <th key={e.id} className="px-2 py-2 text-center" title={e.nombre}>
                {e.nombre}
                <div className="font-normal normal-case text-zinc-400">
                  /{e.puntos_max} · {(e.porcentaje_relativo * 100).toFixed(0)}%
                </div>
                {students.length > 0 && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      applyToAll(
                        e.id,
                        students.map((s) => s.id),
                        getValue(e.id, students[0].id),
                      )
                    }
                    className="mt-0.5 block w-full text-[10px] font-normal normal-case text-zinc-400 hover:text-teal-700 hover:underline"
                  >
                    aplicar a todos
                  </button>
                )}
              </th>
            ))}
            <th className="px-3 py-2 text-center">Nota Pruebas</th>
            <th className="px-3 py-2 text-center">% aporte</th>
            <th className="no-print px-3 py-2 text-center">Reporte</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {students.map((s) => {
            const notaPruebas = exams.reduce((sum, e) => {
              const obtenidos = getValue(e.id, s.id);
              const nota = e.puntos_max > 0 ? (obtenidos * 100) / e.puntos_max : 0;
              return sum + nota * e.porcentaje_relativo;
            }, 0);
            const aporte = notaPruebas * pruebasPct;
            return (
              <tr key={s.id}>
                <td className="sticky left-0 whitespace-nowrap bg-white px-4 py-1.5 font-medium text-zinc-900">
                  {s.primer_apellido} {s.segundo_apellido} {s.nombre}
                </td>
                {exams.map((e) => {
                  const isSuspect = pending?.itemId === e.id && pending.studentId === s.id;
                  const justSaved = isSaved(e.id, s.id);
                  return (
                    <td key={e.id} className={`px-2 py-1.5 text-center ${color.cellBg}`}>
                      <input
                        type="number"
                        min={0}
                        max={e.puntos_max}
                        value={getValue(e.id, s.id)}
                        onChange={(ev) => handleChange(e.id, s.id, ev.target.value)}
                        onBlur={(ev) => handleBlur(e.id, s.id, ev.target.value, e.puntos_max)}
                        disabled={isPending}
                        className={`w-16 rounded-md border px-2 py-1 text-center text-sm transition-colors ${
                          isSuspect
                            ? "border-amber-400 ring-1 ring-amber-300"
                            : justSaved
                              ? "border-emerald-400 ring-1 ring-emerald-200"
                              : "border-zinc-300"
                        }`}
                      />
                    </td>
                  );
                })}
                <td className="px-3 py-1.5 text-center text-zinc-700">
                  {notaPruebas.toFixed(1)}
                </td>
                <td className="px-3 py-1.5 text-center text-zinc-700">{aporte.toFixed(1)}</td>
                <td className="no-print px-3 py-1.5 text-center">
                  <SendRubroReportButton
                    sectionId={sectionId}
                    studentId={s.id}
                    modulo="pruebas"
                    hasEmail={!!s.contacto_correo}
                  />
                </td>
              </tr>
            );
          })}
          {students.length === 0 && (
            <tr>
              <td colSpan={exams.length + 4} className="px-4 py-6 text-center text-zinc-400">
                No hay estudiantes activos en esta sección.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <ConfirmModal
        open={!!pending}
        title="Puntaje fuera de lo esperado"
        description={
          pending
            ? `Registraste ${pending.value} puntos en "${examenPendiente?.nombre ?? ""}", cuyo máximo es ${pending.max}. ¿Confirmas que no fue un error de tipeo?`
            : ""
        }
        onConfirm={confirmPending}
        onCancel={cancelPending}
      />
    </div>
  );
}
