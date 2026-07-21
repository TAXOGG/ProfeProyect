"use client";

import { useState, useTransition } from "react";
import {
  createHomeworkItem,
  deleteHomeworkItem,
  duplicarTareasDePeriodo,
  updateHomeworkItem,
} from "@/lib/actions/homework";
import { ConfirmModal } from "@/components/confirm-modal";
import type { HomeworkItem, Period } from "@/lib/types";

export function HomeworkManager({
  sectionId,
  currentPeriod,
  otherPeriod,
  items,
  otherPeriodHasItems,
}: {
  sectionId: string;
  currentPeriod: Period;
  otherPeriod: Period | null;
  items: HomeworkItem[];
  otherPeriodHasItems: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const createForSection = createHomeworkItem.bind(null, sectionId, currentPeriod.id);

  async function saveEdit(homeworkId: string, formData: FormData) {
    await updateHomeworkItem(sectionId, homeworkId, formData);
    setEditingId(null);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Tareas — {currentPeriod.nombre}</h3>
        {otherPeriod && otherPeriodHasItems && items.length === 0 && (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() =>
                duplicarTareasDePeriodo(sectionId, otherPeriod.id, currentPeriod.id),
              )
            }
            className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
          >
            Duplicar de {otherPeriod.nombre}
          </button>
        )}
      </div>

      {items.length > 0 && (
        <ul className="mt-3 divide-y divide-zinc-100 rounded-md border border-zinc-100">
          {items.map((h) =>
            editingId === h.id ? (
              <li key={h.id} className="px-3 py-2">
                <form
                  action={(fd) => saveEdit(h.id, fd)}
                  className="flex flex-wrap items-end gap-2"
                >
                  <input
                    name="descripcion"
                    required
                    defaultValue={h.descripcion ?? ""}
                    className="min-w-[160px] flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm"
                  />
                  <input
                    name="fecha"
                    type="date"
                    defaultValue={h.fecha ?? ""}
                    className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
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
              <li key={h.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-zinc-700">
                  {h.numero}. {h.descripcion}{" "}
                  <span className="text-zinc-400">({h.fecha ?? "sin fecha"})</span>
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingId(h.id)}
                    className="text-xs text-zinc-500 hover:text-zinc-800"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setDeletingId(h.id)}
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
            placeholder="Ej. Guía de ejercicios cap. 3"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600">Fecha</label>
          <input
            name="fecha"
            type="date"
            className="mt-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
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
        title="Eliminar tarea"
        description="Se van a borrar también las notas que hayas registrado para esta tarea. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          const id = deletingId!;
          setDeletingId(null);
          startTransition(() => deleteHomeworkItem(sectionId, id));
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
