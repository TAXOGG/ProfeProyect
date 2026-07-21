"use client";

import { useState, useTransition } from "react";
import {
  createStage,
  deleteStage,
  duplicarEtapasDePeriodo,
  updateStage,
} from "@/lib/actions/project";
import { ConfirmModal } from "@/components/confirm-modal";
import type { Period, ProjectStage } from "@/lib/types";

export function ProjectStagesManager({
  sectionId,
  currentPeriod,
  otherPeriod,
  stages,
  otherPeriodHasStages,
}: {
  sectionId: string;
  currentPeriod: Period;
  otherPeriod: Period | null;
  stages: ProjectStage[];
  otherPeriodHasStages: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const createForSection = createStage.bind(null, sectionId, currentPeriod.id);

  async function saveEdit(stageId: string, formData: FormData) {
    await updateStage(sectionId, stageId, formData);
    setEditingId(null);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">
          Etapas del proyecto — {currentPeriod.nombre}
        </h3>
        {otherPeriod && otherPeriodHasStages && stages.length === 0 && (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() =>
                duplicarEtapasDePeriodo(sectionId, otherPeriod.id, currentPeriod.id),
              )
            }
            className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
          >
            Duplicar de {otherPeriod.nombre}
          </button>
        )}
      </div>

      {stages.length > 0 && (
        <ul className="mt-3 divide-y divide-zinc-100 rounded-md border border-zinc-100">
          {stages.map((e) =>
            editingId === e.id ? (
              <li key={e.id} className="px-3 py-2">
                <form
                  action={(fd) => saveEdit(e.id, fd)}
                  className="flex flex-wrap items-end gap-2"
                >
                  <input
                    name="nombre"
                    required
                    defaultValue={e.nombre}
                    className="min-w-[160px] flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm"
                  />
                  <input
                    name="puntos_max"
                    type="number"
                    min={1}
                    defaultValue={e.puntos_max}
                    className="w-20 rounded-md border border-zinc-300 px-2 py-1 text-sm"
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
              <li key={e.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-zinc-700">
                  {e.nombre} <span className="text-zinc-400">(máx {e.puntos_max} pts)</span>
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingId(e.id)}
                    className="text-xs text-zinc-500 hover:text-zinc-800"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setDeletingId(e.id)}
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
          <label className="block text-xs font-medium text-zinc-600">Nombre de la etapa</label>
          <input
            name="nombre"
            required
            placeholder="Ej. Ante proyecto"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600">Puntos máx.</label>
          <input
            name="puntos_max"
            type="number"
            min={1}
            required
            className="mt-1 w-24 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
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
        title="Eliminar etapa"
        description="Se van a borrar también los puntos que hayas registrado para esta etapa. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          const id = deletingId!;
          setDeletingId(null);
          startTransition(() => deleteStage(sectionId, id));
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
