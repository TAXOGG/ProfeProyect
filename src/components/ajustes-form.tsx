"use client";

import { useState, useTransition } from "react";
import type { RubricConfig, Period } from "@/lib/types";
import { updateRubric, updatePeriodWeights } from "@/lib/actions/rubric";
import { HelpTooltip } from "@/components/help-tooltip";

export function AjustesForm({
  sectionId,
  notaMinima,
  rubric,
  periods,
}: {
  sectionId: string;
  notaMinima: number;
  rubric: RubricConfig;
  periods: Period[];
}) {
  const [isPending, startTransition] = useTransition();
  const [rubricError, setRubricError] = useState<string | null>(null);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [saved, setSaved] = useState<"rubric" | "periods" | null>(null);

  function submitRubric(formData: FormData) {
    setRubricError(null);
    setSaved(null);
    startTransition(async () => {
      try {
        await updateRubric(sectionId, formData);
        setSaved("rubric");
      } catch (e) {
        setRubricError(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  function submitPeriods(formData: FormData) {
    setPeriodError(null);
    setSaved(null);
    startTransition(async () => {
      try {
        await updatePeriodWeights(sectionId, formData);
        setSaved("periods");
      } catch (e) {
        setPeriodError(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <form action={submitRubric} className="max-w-lg rounded-lg border border-zinc-200 bg-white p-5">
        <h3 className="flex items-center text-sm font-semibold text-zinc-900">
          Distribución de la evaluación
          <HelpTooltip text="Cada rubro representa qué porcentaje de la nota final vale (por ejemplo, si Pruebas está en 50%, eso significa que las pruebas valen la mitad de la nota). Entre todos los rubros deben sumar 100%. Si no usas alguno (por ejemplo Proyecto), ponlo en 0 y ese módulo queda deshabilitado." />
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Los porcentajes deben sumar 100%. Pon un rubro en 0 para deshabilitarlo.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Trabajo Cotidiano %" name="cotidiano_pct" defaultValue={rubric.cotidiano_pct * 100} />
          <Field label="Tareas %" name="tareas_pct" defaultValue={rubric.tareas_pct * 100} />
          <Field label="Asistencia %" name="asistencia_pct" defaultValue={rubric.asistencia_pct * 100} />
          <Field label="Proyecto %" name="proyecto_pct" defaultValue={rubric.proyecto_pct * 100} />
          <Field label="Pruebas %" name="pruebas_pct" defaultValue={rubric.pruebas_pct * 100} />
          <Field label="Nota mínima" name="nota_minima" defaultValue={notaMinima} />
        </div>

        <div className="mt-4 border-t border-zinc-100 pt-4">
          <Field
            label="Tolerancia para aviso de posible error (%)"
            name="tolerancia_pct"
            defaultValue={(rubric.tolerancia_pct ?? 0.1) * 100}
          />
          <p className="mt-1 text-xs text-zinc-400">
            Si un puntaje registrado supera el máximo esperado en más de este %, el sistema pide
            confirmar antes de guardarlo (para detectar posibles errores de tipeo).
          </p>
        </div>

        <div className="mt-4 border-t border-zinc-100 pt-4">
          <label className="flex items-center text-xs font-medium text-zinc-600">
            Política de asistencia (para el correo a padres)
            <HelpTooltip text="Este texto se incluye tal cual cuando envías por correo el reporte de Asistencia de un estudiante — por ejemplo el porcentaje de ausencias que le impide presentarse a convocatoria. Déjalo vacío si no aplica." />
          </label>
          <textarea
            name="asistencia_nota"
            rows={3}
            defaultValue={rubric.asistencia_nota ?? ""}
            placeholder="Ej: Si el estudiante acumula más de 20% de ausencias, no podrá presentarse a convocatoria."
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400"
          />
        </div>

        {rubricError && <p className="mt-3 text-sm text-red-600">{rubricError}</p>}
        {saved === "rubric" && <p className="mt-3 text-sm text-emerald-600">Guardado.</p>}

        <button
          type="submit"
          disabled={isPending}
          className="mt-4 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          Guardar distribución
        </button>
      </form>

      <form action={submitPeriods} className="max-w-lg rounded-lg border border-zinc-200 bg-white p-5">
        <h3 className="flex items-center text-sm font-semibold text-zinc-900">
          Peso de cada periodo (nota anual)
          <HelpTooltip text="La nota anual se calcula combinando la nota de cada periodo según el peso que le des aquí. Lo normal es 50% y 50% (los dos periodos valen igual), pero puedes cambiarlo si tu colegio pesa distinto. Deben sumar 100% entre todos los periodos." />
        </h3>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {periods.map((p) => (
            <Field
              key={p.id}
              label={`${p.nombre} %`}
              name={`periodo_${p.numero}_pct`}
              defaultValue={p.porcentaje * 100}
            />
          ))}
        </div>

        {periodError && <p className="mt-3 text-sm text-red-600">{periodError}</p>}
        {saved === "periods" && <p className="mt-3 text-sm text-emerald-600">Guardado.</p>}

        <button
          type="submit"
          disabled={isPending}
          className="mt-4 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          Guardar periodos
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-600">{label}</label>
      <input
        name={name}
        type="number"
        step="0.01"
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
