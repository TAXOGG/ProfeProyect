import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { InstrumentInfoForm } from "@/components/instrument-info-form";
import { InstrumentBuilder } from "@/components/instrument-builder";
import { TIPO_LABEL, ESTADO_LABEL, ESTADO_BADGE, generaNota } from "@/lib/instrument-labels";
import type { Instrument, InstrumentCriterio, InstrumentEstado, InstrumentNivel, InstrumentTipo } from "@/lib/types";

export default async function InstrumentoPage({
  params,
}: {
  params: Promise<{ instrumentId: string }>;
}) {
  const { instrumentId } = await params;
  const supabase = await createClient();

  const { data: instrument } = await supabase
    .from("instruments")
    .select("*")
    .eq("id", instrumentId)
    .single();

  if (!instrument) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-sm text-zinc-500">
        No se encontró el instrumento.
      </div>
    );
  }

  const { data: criteria } = await supabase
    .from("instrument_criteria")
    .select("*")
    .eq("instrument_id", instrumentId)
    .order("orden");

  const criteriaList = (criteria as InstrumentCriterio[]) ?? [];
  const criteriaIds = criteriaList.map((c) => c.id);

  const { data: levels } =
    criteriaIds.length > 0
      ? await supabase
          .from("instrument_levels")
          .select("*")
          .in("criterio_id", criteriaIds)
          .order("orden")
      : { data: [] as InstrumentNivel[] };

  const inst = instrument as Instrument;
  const puntajeTotal = usaCriteriosVisiblesOTipoHolistica(inst.tipo)
    ? sumaMaxPorCriterio(criteriaList, (levels as InstrumentNivel[]) ?? [])
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8 sm:py-10">
      <Link href="/instrumentos" className="text-xs font-medium text-zinc-500 hover:text-zinc-800">
        ← Volver a Instrumentos
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900">{inst.nombre}</h1>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[inst.estado as InstrumentEstado]}`}
        >
          {ESTADO_LABEL[inst.estado as InstrumentEstado]}
        </span>
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        {TIPO_LABEL[inst.tipo as InstrumentTipo]}
        {puntajeTotal !== null ? ` · Puntaje total: ${puntajeTotal}` : ""}
      </p>

      {inst.estado === "aplicado" && (
        <p className="mt-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
          Este instrumento ya se aplicó al menos una vez, así que su estructura (criterios y
          niveles) quedó protegida contra cambios. Duplicalo si necesitás una versión distinta.
        </p>
      )}

      <div className="mt-6">
        <InstrumentInfoForm instrument={inst} />
      </div>

      {generaNota(inst.tipo) && (
        <div className="mt-6">
          <InstrumentBuilder
            instrumentId={inst.id}
            tipo={inst.tipo as InstrumentTipo}
            criteria={criteriaList}
            levels={(levels as InstrumentNivel[]) ?? []}
            locked={inst.estado === "aplicado"}
          />
        </div>
      )}

      {inst.estado !== "archivado" && (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-5">
          <Link
            href={`/instrumentos/${inst.id}/aplicar`}
            className="inline-block rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Aplicar a una sección
          </Link>
        </div>
      )}
    </div>
  );
}

function usaCriteriosVisiblesOTipoHolistica(tipo: string) {
  return tipo !== "registro_anecdotico";
}

function sumaMaxPorCriterio(criteria: InstrumentCriterio[], levels: InstrumentNivel[]) {
  let total = 0;
  for (const c of criteria) {
    const criterioLevels = levels.filter((l) => l.criterio_id === c.id);
    if (criterioLevels.length === 0) continue;
    total += Math.max(...criterioLevels.map((l) => l.puntaje));
  }
  return total;
}
