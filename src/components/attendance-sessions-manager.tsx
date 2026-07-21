"use client";

import { useState, useTransition } from "react";
import {
  createSession,
  deleteSession,
  generateWeeklySessions,
  updateSession,
  type GenerateSessionsResult,
} from "@/lib/actions/attendance";
import { HelpTooltip } from "@/components/help-tooltip";
import { ConfirmModal } from "@/components/confirm-modal";
import { DIAS_SEMANA } from "@/lib/weekdays";
import type { AttendanceSession, Period } from "@/lib/types";

export function AttendanceSessionsManager({
  sectionId,
  currentPeriod,
  sessions,
}: {
  sectionId: string;
  currentPeriod: Period;
  sessions: AttendanceSession[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showWeekly, setShowWeekly] = useState(false);
  const [weeklyResult, setWeeklyResult] = useState<GenerateSessionsResult | null>(null);
  const createForSection = createSession.bind(null, sectionId, currentPeriod.id);

  async function saveEdit(sessionId: string, formData: FormData) {
    await updateSession(sectionId, sessionId, formData);
    setEditingId(null);
  }

  function submitWeekly(formData: FormData) {
    setWeeklyResult(null);
    startTransition(async () => {
      const res = await generateWeeklySessions(sectionId, currentPeriod.id, formData);
      setWeeklyResult(res);
    });
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <h3 className="flex items-center text-sm font-semibold text-zinc-900">
        Fechas de clase — {currentPeriod.nombre}
        <HelpTooltip text="Primero agrega aquí cada fecha en que tuvo clase con el grupo y cuántas lecciones dio ese día. Después, en la tabla de abajo, escribe cuántas lecciones estuvo ausente cada estudiante ese día: '2' si faltó 2 lecciones, '2j' si la falta fue justificada (no le resta), o '1t' si llegó tarde." />
      </h3>

      {sessions.length > 0 && (
        <ul className="mt-3 flex max-h-48 flex-wrap items-start gap-2 overflow-y-auto rounded-md border border-zinc-100 bg-zinc-50 p-2">
          {sessions.map((s) =>
            editingId === s.id ? (
              <li key={s.id}>
                <form
                  action={(fd) => saveEdit(s.id, fd)}
                  className="flex items-end gap-1.5 rounded-md border border-zinc-200 bg-white p-1.5"
                >
                  <input
                    name="fecha"
                    type="date"
                    required
                    defaultValue={s.fecha}
                    className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                  />
                  <input
                    name="lecciones_impartidas"
                    type="number"
                    min={1}
                    defaultValue={s.lecciones_impartidas}
                    className="w-14 rounded-md border border-zinc-300 px-2 py-1 text-xs"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-teal-700 px-2 py-1 text-xs font-medium text-white hover:bg-teal-800"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-1 text-xs text-zinc-500 hover:text-zinc-800"
                  >
                    Cancelar
                  </button>
                </form>
              </li>
            ) : (
              <li
                key={s.id}
                className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700"
              >
                <button
                  type="button"
                  onClick={() => setEditingId(s.id)}
                  className="hover:text-teal-700"
                >
                  {s.fecha} · {s.lecciones_impartidas} lecc.
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setDeletingId(s.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </li>
            ),
          )}
        </ul>
      )}

      <form action={createForSection} className="mt-4 flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-xs font-medium text-zinc-600">Fecha</label>
          <input
            name="fecha"
            type="date"
            required
            className="mt-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600">Lecciones</label>
          <input
            name="lecciones_impartidas"
            type="number"
            min={1}
            defaultValue={1}
            className="mt-1 w-20 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          + Agregar fecha
        </button>
        <button
          type="button"
          onClick={() => setShowWeekly((v) => !v)}
          className="rounded-md border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {showWeekly ? "Ocultar horario semanal" : "Generar por horario semanal"}
        </button>
      </form>

      {showWeekly && (
        <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <h4 className="flex items-center text-sm font-semibold text-zinc-900">
            Generar fechas por horario semanal
            <HelpTooltip text="Indica cuántas lecciones da cada día de la semana (deja en blanco o en 0 los días que no tiene clase con este grupo) y el rango de fechas. Se crea una fecha por cada día que coincida, dentro del rango. Si un día en particular no hubo clase (feriado, actividad, etc.), puedes borrar esa fecha después con la 'x', igual que ahora." />
          </h4>

          <form action={submitWeekly} className="mt-3 flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {DIAS_SEMANA.map((d) => (
                <div key={d.key}>
                  <label className="block text-xs font-medium text-zinc-600">{d.label}</label>
                  <input
                    name={d.key}
                    type="number"
                    min={0}
                    placeholder="0"
                    className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm placeholder:text-zinc-500"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Desde</label>
                <input
                  name="fecha_inicio"
                  type="date"
                  required
                  className="mt-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Hasta</label>
                <input
                  name="fecha_fin"
                  type="date"
                  required
                  className="mt-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {isPending ? "Generando..." : "Generar fechas"}
              </button>
            </div>
          </form>

          {weeklyResult?.error && <p className="mt-3 text-sm text-red-600">{weeklyResult.error}</p>}
          {weeklyResult?.success && (
            <p className="mt-3 text-sm text-emerald-600">
              Se generaron {weeklyResult.created} fecha{weeklyResult.created === 1 ? "" : "s"}.
              {weeklyResult.skipped
                ? ` Se omitieron ${weeklyResult.skipped} que ya existían.`
                : ""}
            </p>
          )}
        </div>
      )}

      <ConfirmModal
        open={!!deletingId}
        tone="danger"
        title="Eliminar fecha de clase"
        description="Se va a borrar también la asistencia que hayas registrado para esta fecha, de todos los estudiantes. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          const id = deletingId!;
          setDeletingId(null);
          startTransition(() => deleteSession(sectionId, id));
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
