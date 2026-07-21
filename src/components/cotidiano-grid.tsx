"use client";

import { useCallback, useEffect } from "react";
import { upsertPuntaje } from "@/lib/actions/cotidiano";
import { useThresholdGrid } from "@/lib/use-threshold-grid";
import { ConfirmModal } from "@/components/confirm-modal";
import { db } from "@/lib/offline/db";
import { enqueueAction, pullCotidianoData } from "@/lib/offline/sync-engine";
import { moduleColor } from "@/lib/module-colors";
import type { CotidianoIndicator, CotidianoScore, Student } from "@/lib/types";

export function CotidianoGrid({
  sectionId,
  students,
  indicators,
  scores,
  cotidianoPct,
  tolerancePct,
}: {
  sectionId: string;
  students: Student[];
  indicators: CotidianoIndicator[];
  scores: CotidianoScore[];
  cotidianoPct: number;
  tolerancePct: number;
}) {
  const initialValues = Object.fromEntries(
    scores.map((s) => [`${s.indicator_id}:${s.student_id}`, s.puntaje]),
  );

  // Refresca la copia local (IndexedDB) apenas se entra a la página con
  // conexión, para que quede disponible si más tarde se pierde la señal.
  useEffect(() => {
    if (navigator.onLine) pullCotidianoData(sectionId).catch(() => {});
  }, [sectionId]);

  const onPersist = useCallback(
    async (indicatorId: string, studentId: string, value: number) => {
      if (navigator.onLine) {
        try {
          await upsertPuntaje(sectionId, indicatorId, studentId, value);
          return;
        } catch {
          // La red decía que había conexión pero el guardado falló (wifi
          // intermitente) — se guarda local y se encola igual que offline.
        }
      }
      await db.cotidianoScores.put({
        indicator_id: indicatorId,
        student_id: studentId,
        puntaje: value,
      });
      await enqueueAction(
        "cotidiano.upsertPuntaje",
        [sectionId, indicatorId, studentId, value],
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

  const puntosPosibles = indicators.reduce((sum, i) => sum + i.puntos_max, 0);
  const indicadorPendiente = pending
    ? indicators.find((i) => i.id === pending.itemId)
    : undefined;

  if (indicators.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-5 py-10 text-center text-sm text-zinc-400">
        Agrega al menos un indicador para poder registrar el trabajo cotidiano.
      </p>
    );
  }

  const color = moduleColor("cotidiano");

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="sticky left-0 bg-zinc-50 px-4 py-2 text-left">Estudiante</th>
            {indicators.map((i) => (
              <th key={i.id} className="px-2 py-2 text-center" title={i.descripcion}>
                #{i.numero}
                <div className="font-normal normal-case text-zinc-400">/{i.puntos_max}</div>
                {students.length > 0 && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      applyToAll(
                        i.id,
                        students.map((s) => s.id),
                        getValue(i.id, students[0].id),
                      )
                    }
                    className="mt-0.5 block w-full text-[10px] font-normal normal-case text-zinc-400 hover:text-teal-700 hover:underline"
                  >
                    aplicar a todos
                  </button>
                )}
              </th>
            ))}
            <th className="px-3 py-2 text-center">Nota</th>
            <th className="px-3 py-2 text-center">% aporte</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {students.map((s) => {
            const obtenidos = indicators.reduce(
              (sum, i) => sum + getValue(i.id, s.id),
              0,
            );
            const nota = puntosPosibles > 0 ? (obtenidos * 100) / puntosPosibles : 0;
            const aporte = nota * cotidianoPct;
            return (
              <tr key={s.id}>
                <td className="sticky left-0 whitespace-nowrap bg-white px-4 py-1.5 font-medium text-zinc-900">
                  {s.primer_apellido} {s.segundo_apellido} {s.nombre}
                </td>
                {indicators.map((i) => {
                  const isSuspect =
                    pending?.itemId === i.id && pending.studentId === s.id;
                  const justSaved = isSaved(i.id, s.id);
                  return (
                    <td key={i.id} className={`px-2 py-1.5 text-center ${color.cellBg}`}>
                      <input
                        type="number"
                        min={0}
                        max={i.puntos_max}
                        value={getValue(i.id, s.id)}
                        onChange={(e) => handleChange(i.id, s.id, e.target.value)}
                        onBlur={(e) => handleBlur(i.id, s.id, e.target.value, i.puntos_max)}
                        disabled={isPending}
                        className={`w-14 rounded-md border px-2 py-1 text-center text-sm transition-colors ${
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
              <td colSpan={indicators.length + 3} className="px-4 py-6 text-center text-zinc-400">
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
            ? `Registraste ${pending.value} puntos para "${indicadorPendiente?.descripcion ?? ""}", cuyo máximo es ${pending.max}. ¿Confirmas que no fue un error de tipeo?`
            : ""
        }
        onConfirm={confirmPending}
        onCancel={cancelPending}
      />
    </div>
  );
}
