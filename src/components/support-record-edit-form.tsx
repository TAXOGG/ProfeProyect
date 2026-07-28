"use client";

import { useRef, useState, useTransition } from "react";
import {
  updateSupportRecord,
  duplicateSupportRecord,
  setSupportRecordEstado,
} from "@/lib/actions/support-records";
import { TIPOS_APOYO_SUGERIDOS } from "@/lib/support-types";
import { ObservationPicker } from "@/components/observation-picker";
import type { ObservationContext } from "@/lib/observation-variables";
import type { ObservationTemplate, SupportRecord } from "@/lib/types";

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function SupportRecordEditForm({
  sectionId,
  record,
  observations,
  observationContext,
}: {
  sectionId: string;
  record: SupportRecord;
  observations: ObservationTemplate[];
  observationContext: ObservationContext;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const resultadoRef = useRef<HTMLTextAreaElement>(null);

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (e) {
        if (isRedirectError(e)) throw e;
        setError(e instanceof Error ? e.message : "No se pudo completar la acción.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <form
        action={(fd) => {
          setSaved(false);
          run(async () => {
            await updateSupportRecord(sectionId, record.id, fd);
            setSaved(true);
          });
        }}
        className="flex flex-col gap-3"
      >
        <div>
          <label className="block text-xs font-medium text-zinc-600">Tipo de apoyo</label>
          <input
            name="tipo_apoyo"
            list="tipos-apoyo-edit"
            required
            defaultValue={record.tipo_apoyo}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <datalist id="tipos-apoyo-edit">
            {TIPOS_APOYO_SUGERIDOS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600">Descripción del apoyo</label>
          <textarea
            name="descripcion"
            required
            rows={2}
            defaultValue={record.descripcion}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600">Motivo o necesidad</label>
          <textarea
            name="motivo"
            rows={2}
            defaultValue={record.motivo ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600">Actividad o contexto</label>
          <input
            name="contexto"
            defaultValue={record.contexto ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-zinc-600">Resultado observado</label>
            <ObservationPicker
              observations={observations}
              context={observationContext}
              onInsert={(text) => {
                const el = resultadoRef.current;
                if (!el) return;
                el.value = el.value ? `${el.value} ${text}` : text;
              }}
            />
          </div>
          <textarea
            ref={resultadoRef}
            name="resultado_observado"
            rows={2}
            defaultValue={record.resultado_observado ?? ""}
            placeholder="Qué efecto tuvo el apoyo"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600">Responsable</label>
          <input
            name="responsable"
            defaultValue={record.responsable ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="rounded-md border border-zinc-200 p-3">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="seguimiento_requerido"
              defaultChecked={record.seguimiento_requerido}
              className="rounded"
            />
            Requiere seguimiento
          </label>
          <div className="mt-2">
            <label className="block text-xs font-medium text-zinc-600">Próximo seguimiento</label>
            <input
              name="proximo_seguimiento"
              type="date"
              defaultValue={record.proximo_seguimiento ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && !error && <p className="text-sm text-emerald-600">Guardado.</p>}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {isPending ? "Guardando..." : "Guardar cambios"}
          </button>
          <div className="flex gap-3 text-xs">
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(() => duplicateSupportRecord(sectionId, record.id))}
              className="font-medium text-zinc-500 hover:text-teal-700 disabled:opacity-50"
            >
              Duplicar
            </button>
            {record.estado === "archivado" ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => run(() => setSupportRecordEstado(sectionId, record.id, "activo"))}
                className="font-medium text-zinc-500 hover:text-teal-700 disabled:opacity-50"
              >
                Reactivar
              </button>
            ) : (
              <button
                type="button"
                disabled={isPending}
                onClick={() => run(() => setSupportRecordEstado(sectionId, record.id, "archivado"))}
                className="font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                Archivar
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
