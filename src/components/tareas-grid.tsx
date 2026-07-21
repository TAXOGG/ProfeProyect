"use client";

import { useEffect, useState, useTransition } from "react";
import { upsertHomeworkScore } from "@/lib/actions/homework";
import { db } from "@/lib/offline/db";
import { enqueueAction, pullTareasData } from "@/lib/offline/sync-engine";
import { moduleColor } from "@/lib/module-colors";
import { SendRubroReportButton } from "@/components/send-rubro-report-button";
import type { HomeworkItem, HomeworkScore, Student } from "@/lib/types";

export function TareasGrid({
  sectionId,
  students,
  items,
  scores,
  tareasPct,
}: {
  sectionId: string;
  students: Student[];
  items: HomeworkItem[];
  scores: HomeworkScore[];
  tareasPct: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const s of scores) map[`${s.homework_id}:${s.student_id}`] = s.nota;
    return map;
  });
  const [savedFlags, setSavedFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (navigator.onLine) pullTareasData(sectionId).catch(() => {});
  }, [sectionId]);

  function key(homeworkId: string, studentId: string) {
    return `${homeworkId}:${studentId}`;
  }

  function getValue(homeworkId: string, studentId: string) {
    return values[key(homeworkId, studentId)] ?? 0;
  }

  function isSaved(homeworkId: string, studentId: string) {
    return !!savedFlags[key(homeworkId, studentId)];
  }

  function markSaved(k: string) {
    setSavedFlags((prev) => ({ ...prev, [k]: true }));
    setTimeout(() => {
      setSavedFlags((prev) => ({ ...prev, [k]: false }));
    }, 1500);
  }

  function handleChange(homeworkId: string, studentId: string, raw: string) {
    const value = Math.min(100, Math.max(0, Number(raw) || 0));
    setValues((prev) => ({ ...prev, [key(homeworkId, studentId)]: value }));
  }

  function commit(homeworkId: string, studentId: string, value: number) {
    const k = key(homeworkId, studentId);
    startTransition(async () => {
      if (navigator.onLine) {
        try {
          await upsertHomeworkScore(sectionId, homeworkId, studentId, value);
          markSaved(k);
          return;
        } catch {
          // wifi intermitente: cae al camino offline igual
        }
      }
      await db.homeworkScores.put({ homework_id: homeworkId, student_id: studentId, nota: value });
      await enqueueAction(
        "tareas.upsertHomeworkScore",
        [sectionId, homeworkId, studentId, value],
        sectionId,
      );
      markSaved(k);
    });
  }

  function handleBlur(homeworkId: string, studentId: string, raw: string) {
    const value = Math.min(100, Math.max(0, Number(raw) || 0));
    commit(homeworkId, studentId, value);
  }

  function applyToAll(homeworkId: string, studentIds: string[], value: number) {
    setValues((prev) => {
      const next = { ...prev };
      for (const studentId of studentIds) next[key(homeworkId, studentId)] = value;
      return next;
    });
    for (const studentId of studentIds) commit(homeworkId, studentId, value);
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-5 py-10 text-center text-sm text-zinc-400">
        Agrega al menos una tarea para poder registrar notas.
      </p>
    );
  }

  const color = moduleColor("tareas");

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="sticky left-0 bg-zinc-50 px-4 py-2 text-left">Estudiante</th>
            {items.map((h) => (
              <th key={h.id} className="px-2 py-2 text-center" title={h.descripcion ?? ""}>
                #{h.numero}
                {students.length > 0 && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      applyToAll(
                        h.id,
                        students.map((s) => s.id),
                        getValue(h.id, students[0].id),
                      )
                    }
                    className="mt-0.5 block w-full text-[10px] font-normal normal-case text-zinc-400 hover:text-teal-700 hover:underline"
                  >
                    aplicar a todos
                  </button>
                )}
              </th>
            ))}
            <th className="px-3 py-2 text-center">Nota Tareas</th>
            <th className="px-3 py-2 text-center">% aporte</th>
            <th className="no-print px-3 py-2 text-center">Reporte</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {students.map((s) => {
            const notaTareas =
              items.reduce((sum, h) => sum + getValue(h.id, s.id), 0) / items.length;
            const aporte = notaTareas * tareasPct;
            return (
              <tr key={s.id}>
                <td className="sticky left-0 whitespace-nowrap bg-white px-4 py-1.5 font-medium text-zinc-900">
                  {s.primer_apellido} {s.segundo_apellido} {s.nombre}
                </td>
                {items.map((h) => {
                  const justSaved = isSaved(h.id, s.id);
                  return (
                    <td key={h.id} className={`px-2 py-1.5 text-center ${color.cellBg}`}>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={getValue(h.id, s.id)}
                        onChange={(e) => handleChange(h.id, s.id, e.target.value)}
                        onBlur={(e) => handleBlur(h.id, s.id, e.target.value)}
                        disabled={isPending}
                        className={`w-16 rounded-md border px-2 py-1 text-center text-sm transition-colors ${
                          justSaved ? "border-emerald-400 ring-1 ring-emerald-200" : "border-zinc-300"
                        }`}
                      />
                    </td>
                  );
                })}
                <td className="px-3 py-1.5 text-center text-zinc-700">
                  {notaTareas.toFixed(1)}
                </td>
                <td className="px-3 py-1.5 text-center text-zinc-700">{aporte.toFixed(1)}</td>
                <td className="no-print px-3 py-1.5 text-center">
                  <SendRubroReportButton
                    sectionId={sectionId}
                    studentId={s.id}
                    modulo="tareas"
                    hasEmail={!!s.contacto_correo}
                  />
                </td>
              </tr>
            );
          })}
          {students.length === 0 && (
            <tr>
              <td colSpan={items.length + 4} className="px-4 py-6 text-center text-zinc-400">
                No hay estudiantes activos en esta sección.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
