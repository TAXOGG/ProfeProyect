"use client";

import { useState, useTransition } from "react";
import {
  addCriterio,
  updateCriterio,
  deleteCriterio,
  addNivel,
  updateNivel,
  deleteNivel,
} from "@/lib/actions/instruments";
import { ConfirmModal } from "@/components/confirm-modal";
import { HelpTooltip } from "@/components/help-tooltip";
import type { InstrumentCriterio, InstrumentNivel, InstrumentTipo } from "@/lib/types";

const NIVEL_PLACEHOLDER: Partial<Record<InstrumentTipo, { nombre: string; puntaje: number }>> = {
  lista_cotejo: { nombre: "Cumple", puntaje: 1 },
  escala_valoracion: { nombre: "Siempre", puntaje: 3 },
  rubrica_analitica: { nombre: "Excelente", puntaje: 4 },
  rubrica_holistica: { nombre: "Excelente", puntaje: 4 },
};

function CriterioLevels({
  criterioId,
  tipo,
  levels,
  locked,
}: {
  criterioId: string;
  tipo: InstrumentTipo;
  levels: InstrumentNivel[];
  locked: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [editingNivel, setEditingNivel] = useState<InstrumentNivel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const placeholder = NIVEL_PLACEHOLDER[tipo] ?? { nombre: "Nivel", puntaje: 1 };

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar.");
      }
    });
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {levels.map((l) =>
        editingNivel?.id === l.id ? (
          <form
            key={l.id}
            action={(fd) => {
              run(() => updateNivel(l.id, fd));
              setEditingNivel(null);
            }}
            className="flex flex-wrap items-center gap-2 rounded-md bg-zinc-50 px-2 py-1.5"
          >
            <input
              name="nombre"
              required
              defaultValue={l.nombre}
              className="w-28 rounded border border-zinc-300 px-2 py-1 text-xs"
            />
            <input
              name="puntaje"
              type="number"
              step="0.1"
              min={0}
              required
              defaultValue={l.puntaje}
              className="w-16 rounded border border-zinc-300 px-2 py-1 text-xs"
            />
            <input
              name="descripcion"
              placeholder="Descriptor (opcional)"
              defaultValue={l.descripcion ?? ""}
              className="min-w-[140px] flex-1 rounded border border-zinc-300 px-2 py-1 text-xs placeholder:text-zinc-400"
            />
            <button type="submit" className="text-xs font-medium text-teal-700 hover:underline">
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditingNivel(null)}
              className="text-xs text-zinc-500 hover:underline"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <div
            key={l.id}
            className="flex items-center justify-between gap-2 rounded-md bg-zinc-50 px-2 py-1.5 text-xs"
          >
            <span>
              <strong className="text-zinc-800">{l.nombre}</strong>{" "}
              <span className="text-zinc-500">({l.puntaje} pts)</span>
              {l.descripcion ? <span className="text-zinc-400"> — {l.descripcion}</span> : ""}
            </span>
            {!locked && (
              <span className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNivel(l)}
                  className="text-teal-700 hover:underline"
                >
                  Editar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => run(() => deleteNivel(l.id))}
                  className="text-red-500 hover:underline disabled:opacity-50"
                >
                  Eliminar
                </button>
              </span>
            )}
          </div>
        ),
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {!locked &&
        (adding ? (
          <form
            action={(fd) => {
              run(() => addNivel(criterioId, fd));
              setAdding(false);
            }}
            className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-zinc-300 px-2 py-1.5"
          >
            <input
              name="nombre"
              required
              placeholder={placeholder.nombre}
              className="w-28 rounded border border-zinc-300 px-2 py-1 text-xs placeholder:text-zinc-400"
            />
            <input
              name="puntaje"
              type="number"
              step="0.1"
              min={0}
              required
              defaultValue={placeholder.puntaje}
              className="w-16 rounded border border-zinc-300 px-2 py-1 text-xs"
            />
            <input
              name="descripcion"
              placeholder="Descriptor (opcional)"
              className="min-w-[140px] flex-1 rounded border border-zinc-300 px-2 py-1 text-xs placeholder:text-zinc-400"
            />
            <button type="submit" className="text-xs font-medium text-teal-700 hover:underline">
              Agregar
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-xs text-zinc-500 hover:underline"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mt-0.5 self-start text-xs font-medium text-teal-700 hover:underline"
          >
            + Agregar nivel
          </button>
        ))}
    </div>
  );
}

export function InstrumentBuilder({
  instrumentId,
  tipo,
  criteria,
  levels,
  locked,
}: {
  instrumentId: string;
  tipo: InstrumentTipo;
  criteria: InstrumentCriterio[];
  levels: InstrumentNivel[];
  locked: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [addingCriterio, setAddingCriterio] = useState(false);
  const [editingCriterio, setEditingCriterio] = useState<InstrumentCriterio | null>(null);
  const [deleting, setDeleting] = useState<InstrumentCriterio | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar.");
      }
    });
  }

  const holistica = tipo === "rubrica_holistica";
  const titulo = holistica ? "Niveles de desempeño" : "Criterios";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <h3 className="flex items-center text-sm font-semibold text-zinc-900">
        {titulo}
        {holistica && (
          <HelpTooltip text="La rúbrica holística califica el desempeño general del estudiante con un solo puntaje, no criterio por criterio — por eso acá solo definís los niveles (ej. Excelente, Bueno, Regular) y su puntaje, sin una lista de criterios separada." />
        )}
      </h3>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {holistica ? (
        criteria[0] ? (
          <CriterioLevels
            criterioId={criteria[0].id}
            tipo={tipo}
            levels={levels.filter((l) => l.criterio_id === criteria[0].id)}
            locked={locked}
          />
        ) : (
          <p className="mt-2 text-xs text-zinc-400">No se pudo cargar el instrumento.</p>
        )
      ) : (
        <div className="mt-3 flex flex-col gap-4">
          {criteria.map((c) =>
            editingCriterio?.id === c.id ? (
              <form
                key={c.id}
                action={(fd) => {
                  run(() => updateCriterio(c.id, fd));
                  setEditingCriterio(null);
                }}
                className="flex items-center gap-2"
              >
                <input
                  name="descripcion"
                  required
                  defaultValue={c.descripcion}
                  className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
                />
                <button type="submit" className="text-xs font-medium text-teal-700 hover:underline">
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCriterio(null)}
                  className="text-xs text-zinc-500 hover:underline"
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <div key={c.id} className="rounded-md border border-zinc-100 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-800">{c.descripcion}</p>
                  {!locked && (
                    <span className="flex shrink-0 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setEditingCriterio(c)}
                        className="text-teal-700 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(c)}
                        className="text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    </span>
                  )}
                </div>
                <CriterioLevels
                  criterioId={c.id}
                  tipo={tipo}
                  levels={levels.filter((l) => l.criterio_id === c.id)}
                  locked={locked}
                />
              </div>
            ),
          )}

          {criteria.length === 0 && (
            <p className="text-xs text-zinc-400">Todavía no agregaste ningún criterio.</p>
          )}

          {!locked &&
            (addingCriterio ? (
              <form
                action={(fd) => {
                  run(() => addCriterio(instrumentId, fd));
                  setAddingCriterio(false);
                }}
                className="flex items-center gap-2"
              >
                <input
                  name="descripcion"
                  required
                  placeholder="Ej: Ortografía y redacción"
                  className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm placeholder:text-zinc-400"
                />
                <button type="submit" className="text-xs font-medium text-teal-700 hover:underline">
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={() => setAddingCriterio(false)}
                  className="text-xs text-zinc-500 hover:underline"
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setAddingCriterio(true)}
                className="self-start text-sm font-medium text-teal-700 hover:underline"
              >
                + Agregar criterio
              </button>
            ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleting}
        tone="danger"
        title="Eliminar criterio"
        description={
          deleting
            ? `"${deleting.descripcion}" y todos sus niveles se van a eliminar. Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (deleting) run(() => deleteCriterio(deleting.id));
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />

      {isPending && <p className="mt-2 text-xs text-zinc-400">Guardando...</p>}
    </div>
  );
}
