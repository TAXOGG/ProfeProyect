"use client";

import { useRef, useState, useTransition } from "react";
import { closePeriod, reopenPeriod } from "@/lib/actions/rubric";
import { ConfirmModal } from "@/components/confirm-modal";
import { HelpTooltip } from "@/components/help-tooltip";
import type { Period } from "@/lib/types";

const ESTADO_BADGE: Record<Period["estado"], string> = {
  borrador: "bg-zinc-100 text-zinc-600",
  activo: "bg-emerald-100 text-emerald-700",
  cerrado: "bg-red-100 text-red-700",
  reabierto: "bg-amber-100 text-amber-700",
};

const ESTADO_LABEL: Record<Period["estado"], string> = {
  borrador: "Borrador",
  activo: "Activo",
  cerrado: "Cerrado",
  reabierto: "Reabierto",
};

export function PeriodStateCard({
  sectionId,
  periods,
  cerradoPorNombre,
}: {
  sectionId: string;
  periods: Period[];
  cerradoPorNombre: Record<string, string>;
}) {
  const [isPending, startTransition] = useTransition();
  const [closingPeriod, setClosingPeriod] = useState<Period | null>(null);
  const [reopeningPeriod, setReopeningPeriod] = useState<Period | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="max-w-lg rounded-lg border border-zinc-200 bg-white p-5">
      <h3 className="flex items-center text-sm font-semibold text-zinc-900">
        Estado de los periodos
        <HelpTooltip text="Cerrar un periodo bloquea cambios en Cotidiano, Pruebas, Tareas, Proyecto y Asistencia de ese periodo (para evitar ediciones accidentales después de entregar notas). Podés seguir consultando y exportando. Reabrirlo pide un motivo, que queda guardado en el Historial." />
      </h3>

      <div className="mt-3 flex flex-col gap-3">
        {periods.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-zinc-900">
                {p.nombre}{" "}
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[p.estado]}`}
                >
                  {ESTADO_LABEL[p.estado]}
                </span>
              </p>
              {p.estado === "cerrado" && p.cerrado_at && (
                <p className="mt-0.5 text-xs text-zinc-500">
                  Cerrado el {new Date(p.cerrado_at).toLocaleString("es-CR")}
                  {cerradoPorNombre[p.id] ? ` por ${cerradoPorNombre[p.id]}` : ""}
                </p>
              )}
              {p.estado === "reabierto" && p.razon_reapertura && (
                <p className="mt-0.5 text-xs text-zinc-500">Motivo: {p.razon_reapertura}</p>
              )}
            </div>

            {p.estado === "cerrado" ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => setReopeningPeriod(p)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Reabrir
              </button>
            ) : (
              <button
                type="button"
                disabled={isPending}
                onClick={() => setClosingPeriod(p)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Cerrar periodo
              </button>
            )}
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <ConfirmModal
        open={!!closingPeriod}
        tone="warning"
        title={`Cerrar ${closingPeriod?.nombre ?? "periodo"}`}
        description="Vas a bloquear cambios en Cotidiano, Pruebas, Tareas, Proyecto y Asistencia de este periodo. Podés seguir consultando y exportando. Se puede reabrir después si hace falta."
        confirmLabel="Cerrar periodo"
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (closingPeriod) {
            setError(null);
            startTransition(async () => {
              try {
                await closePeriod(sectionId, closingPeriod.id);
              } catch (e) {
                setError(e instanceof Error ? e.message : "No se pudo cerrar el periodo.");
              }
            });
          }
          setClosingPeriod(null);
        }}
        onCancel={() => setClosingPeriod(null)}
      />

      {reopeningPeriod && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={() => setReopeningPeriod(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-semibold text-zinc-900">
              Reabrir {reopeningPeriod.nombre}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Indicá el motivo — queda guardado y visible en el Historial de la sección.
            </p>
            <textarea
              ref={reasonRef}
              rows={3}
              placeholder="Ej: el padre pidió corrección de una nota mal digitada"
              className="mt-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReopeningPeriod(null)}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  const razon = reasonRef.current?.value.trim() ?? "";
                  if (!razon) {
                    setError("Indicá el motivo de la reapertura.");
                    return;
                  }
                  setError(null);
                  const formData = new FormData();
                  formData.set("razon", razon);
                  const period = reopeningPeriod;
                  startTransition(async () => {
                    try {
                      await reopenPeriod(sectionId, period.id, formData);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "No se pudo reabrir el periodo.");
                    }
                  });
                  setReopeningPeriod(null);
                }}
                className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                Reabrir periodo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
