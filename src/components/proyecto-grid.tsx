"use client";

import { useCallback, useEffect } from "react";
import { upsertStageScore } from "@/lib/actions/project";
import { useThresholdGrid } from "@/lib/use-threshold-grid";
import { ConfirmModal } from "@/components/confirm-modal";
import { db } from "@/lib/offline/db";
import { enqueueAction, pullProyectoData } from "@/lib/offline/sync-engine";
import { moduleColor } from "@/lib/module-colors";
import type { ProjectScore, ProjectStage, Student } from "@/lib/types";

export function ProyectoGrid({
  sectionId,
  students,
  stages,
  scores,
  proyectoPct,
  tolerancePct,
}: {
  sectionId: string;
  students: Student[];
  stages: ProjectStage[];
  scores: ProjectScore[];
  proyectoPct: number;
  tolerancePct: number;
}) {
  const initialValues = Object.fromEntries(
    scores.map((s) => [`${s.stage_id}:${s.student_id}`, s.puntos_obtenidos]),
  );

  useEffect(() => {
    if (navigator.onLine) pullProyectoData(sectionId).catch(() => {});
  }, [sectionId]);

  const onPersist = useCallback(
    async (stageId: string, studentId: string, value: number) => {
      if (navigator.onLine) {
        try {
          await upsertStageScore(sectionId, stageId, studentId, value);
          return;
        } catch {
          // wifi intermitente: cae al camino offline igual
        }
      }
      await db.projectScores.put({ stage_id: stageId, student_id: studentId, puntos_obtenidos: value });
      await enqueueAction(
        "proyecto.upsertStageScore",
        [sectionId, stageId, studentId, value],
        sectionId,
      );
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

  const puntosPosibles = stages.reduce((sum, e) => sum + e.puntos_max, 0);
  const etapaPendiente = pending ? stages.find((e) => e.id === pending.itemId) : undefined;

  if (stages.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-5 py-10 text-center text-sm text-zinc-400">
        Agrega al menos una etapa para poder registrar el proyecto.
      </p>
    );
  }

  const color = moduleColor("proyecto");

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="sticky left-0 bg-zinc-50 px-4 py-2 text-left">Estudiante</th>
            {stages.map((e) => (
              <th key={e.id} className="px-2 py-2 text-center" title={e.nombre}>
                {e.nombre}
                <div className="font-normal normal-case text-zinc-400">/{e.puntos_max}</div>
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
            <th className="px-3 py-2 text-center">Nota Proyecto</th>
            <th className="px-3 py-2 text-center">% aporte</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {students.map((s) => {
            const obtenidos = stages.reduce((sum, e) => sum + getValue(e.id, s.id), 0);
            const nota = puntosPosibles > 0 ? (obtenidos * 100) / puntosPosibles : 0;
            const aporte = nota * proyectoPct;
            return (
              <tr key={s.id}>
                <td className="sticky left-0 whitespace-nowrap bg-white px-4 py-1.5 font-medium text-zinc-900">
                  {s.primer_apellido} {s.segundo_apellido} {s.nombre}
                </td>
                {stages.map((e) => {
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
                <td className="px-3 py-1.5 text-center text-zinc-700">{nota.toFixed(1)}</td>
                <td className="px-3 py-1.5 text-center text-zinc-700">{aporte.toFixed(1)}</td>
              </tr>
            );
          })}
          {students.length === 0 && (
            <tr>
              <td colSpan={stages.length + 3} className="px-4 py-6 text-center text-zinc-400">
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
            ? `Registraste ${pending.value} puntos en "${etapaPendiente?.nombre ?? ""}", cuyo máximo es ${pending.max}. ¿Confirmas que no fue un error de tipeo?`
            : ""
        }
        onConfirm={confirmPending}
        onCancel={cancelPending}
      />
    </div>
  );
}
