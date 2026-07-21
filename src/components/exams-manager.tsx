"use client";

import { useState, useTransition } from "react";
import { createExam, deleteExam, duplicarExamenesDePeriodo, updateExam } from "@/lib/actions/exams";
import { HelpTooltip } from "@/components/help-tooltip";
import { ConfirmModal } from "@/components/confirm-modal";
import type { Exam, Period } from "@/lib/types";

export function ExamsManager({
  sectionId,
  currentPeriod,
  otherPeriod,
  exams,
  otherPeriodHasExams,
}: {
  sectionId: string;
  currentPeriod: Period;
  otherPeriod: Period | null;
  exams: Exam[];
  otherPeriodHasExams: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const createForSection = createExam.bind(null, sectionId, currentPeriod.id);

  const pesoTotal = exams.reduce((sum, e) => sum + e.porcentaje_relativo, 0);
  const pesoOk = Math.abs(pesoTotal - 1) < 0.001;

  async function saveEdit(examId: string, formData: FormData) {
    await updateExam(sectionId, examId, formData);
    setEditingId(null);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Pruebas — {currentPeriod.nombre}</h3>
        {otherPeriod && otherPeriodHasExams && exams.length === 0 && (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() =>
                duplicarExamenesDePeriodo(sectionId, otherPeriod.id, currentPeriod.id),
              )
            }
            className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
          >
            Duplicar de {otherPeriod.nombre}
          </button>
        )}
      </div>

      {exams.length > 0 && (
        <>
          <ul className="mt-3 divide-y divide-zinc-100 rounded-md border border-zinc-100">
            {exams.map((e) =>
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
                      className="min-w-[140px] flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm"
                    />
                    <input
                      name="puntos_max"
                      type="number"
                      min={1}
                      defaultValue={e.puntos_max}
                      className="w-20 rounded-md border border-zinc-300 px-2 py-1 text-sm"
                    />
                    <input
                      name="peso_pct"
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={e.porcentaje_relativo * 100}
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
                <li key={e.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-zinc-700">
                    {e.nombre}{" "}
                    <span className="text-zinc-400">
                      (máx {e.puntos_max} pts · peso {(e.porcentaje_relativo * 100).toFixed(0)}%)
                    </span>
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
          <p className={`mt-2 text-xs ${pesoOk ? "text-emerald-600" : "text-amber-600"}`}>
            Peso total: {(pesoTotal * 100).toFixed(0)}%{" "}
            {pesoOk ? "" : "— debe sumar 100% entre todas las pruebas del periodo."}
          </p>
        </>
      )}

      <form action={createForSection} className="mt-4 flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-zinc-600">Nombre</label>
          <input
            name="nombre"
            required
            placeholder="Prueba corta 1"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600">Puntos totales</label>
          <input
            name="puntos_max"
            type="number"
            min={1}
            required
            className="mt-1 w-24 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="flex items-center text-xs font-medium text-zinc-600">
            Peso %
            <HelpTooltip text="Si tienes 2 pruebas, decide cuánto vale cada una dentro del rubro Pruebas. Por ejemplo: 60% la primera y 40% la segunda. Entre todas las pruebas del periodo deben sumar 100%." />
          </label>
          <input
            name="peso_pct"
            type="number"
            min={0}
            max={100}
            required
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
        title="Eliminar prueba"
        description="Se van a borrar también los puntos que hayas registrado para esta prueba. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          const id = deletingId!;
          setDeletingId(null);
          startTransition(() => deleteExam(sectionId, id));
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
