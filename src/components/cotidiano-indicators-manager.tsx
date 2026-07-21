"use client";

import { useState, useTransition } from "react";
import {
  createIndicador,
  deleteIndicador,
  duplicarIndicadoresDePeriodo,
  updateIndicador,
} from "@/lib/actions/cotidiano";
import { HelpTooltip } from "@/components/help-tooltip";
import { ConfirmModal } from "@/components/confirm-modal";
import type { CotidianoIndicator, Period } from "@/lib/types";

export function CotidianoIndicatorsManager({
  sectionId,
  currentPeriod,
  otherPeriod,
  indicators,
  otherPeriodHasIndicators,
}: {
  sectionId: string;
  currentPeriod: Period;
  otherPeriod: Period | null;
  indicators: CotidianoIndicator[];
  otherPeriodHasIndicators: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const createForSection = createIndicador.bind(null, sectionId, currentPeriod.id);

  async function saveEdit(indicatorId: string, formData: FormData) {
    await updateIndicador(sectionId, indicatorId, formData);
    setEditingId(null);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center text-sm font-semibold text-zinc-900">
          Indicadores — {currentPeriod.nombre}
          <HelpTooltip text="Un indicador es lo que evalúas día a día en clase (ej: 'Resuelve ejercicios de MRU'). Los 'Puntos máx.' son el nivel más alto que puede sacar un estudiante en ese indicador (por ejemplo, hasta 3 puntos). Luego, en la tabla de abajo, le pones a cada estudiante cuántos puntos sacó en cada indicador." />
        </h3>
        {otherPeriod && otherPeriodHasIndicators && indicators.length === 0 && (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() =>
                duplicarIndicadoresDePeriodo(sectionId, otherPeriod.id, currentPeriod.id),
              )
            }
            className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
          >
            Duplicar de {otherPeriod.nombre}
          </button>
        )}
      </div>

      {indicators.length > 0 && (
        <ul className="mt-3 divide-y divide-zinc-100 rounded-md border border-zinc-100">
          {indicators.map((i) =>
            editingId === i.id ? (
              <li key={i.id} className="px-3 py-2">
                <form
                  action={(fd) => saveEdit(i.id, fd)}
                  className="flex flex-wrap items-end gap-2"
                >
                  <input
                    name="descripcion"
                    required
                    defaultValue={i.descripcion}
                    className="min-w-[160px] flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm"
                  />
                  <input
                    name="fecha_aplicacion"
                    type="date"
                    defaultValue={i.fecha_aplicacion ?? ""}
                    className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
                  />
                  <input
                    name="puntos_max"
                    type="number"
                    min={1}
                    defaultValue={i.puntos_max}
                    className="w-16 rounded-md border border-zinc-300 px-2 py-1 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-teal-700 px-3 py-1 text-xs font-medium text-white hover:bg-teal-800"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-xs text-zinc-500 hover:text-zinc-800"
                  >
                    Cancelar
                  </button>
                </form>
              </li>
            ) : (
              <li key={i.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-zinc-700">
                  {i.numero}. {i.descripcion}{" "}
                  <span className="text-zinc-400">
                    ({i.fecha_aplicacion ?? "sin fecha"} · máx {i.puntos_max})
                  </span>
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingId(i.id)}
                    className="text-xs text-zinc-500 hover:text-zinc-800"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setDeletingId(i.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      <form action={createForSection} className="mt-4 flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-zinc-600">Descripción</label>
          <input
            name="descripcion"
            required
            placeholder="Ej. Resuelve ejercicios de MRU"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600">Fecha</label>
          <input
            name="fecha_aplicacion"
            type="date"
            className="mt-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600">Puntos máx.</label>
          <input
            name="puntos_max"
            type="number"
            min={1}
            defaultValue={3}
            className="mt-1 w-20 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          + Agregar
        </button>
      </form>

      <ConfirmModal
        open={!!deletingId}
        tone="danger"
        title="Eliminar indicador"
        description="Se van a borrar también los puntajes que hayas registrado para este indicador. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          const id = deletingId!;
          setDeletingId(null);
          startTransition(() => deleteIndicador(sectionId, id));
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
