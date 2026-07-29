import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { CommunicationTemplatesManager } from "@/components/communication-templates-manager";
import { TIPO_LABEL, ESTADO_LABEL, ESTADO_BADGE } from "@/lib/instrument-labels";
import type { CommunicationTemplate, Instrument, InstrumentEstado, InstrumentTipo, ObservationTemplate } from "@/lib/types";

export default async function PlantillasPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const [{ data: instruments }, { data: observations }, { data: communicationTemplates }] =
    await Promise.all([
      user
        ? supabase.from("instruments").select("*").eq("owner_id", user.id).order("updated_at", { ascending: false })
        : Promise.resolve({ data: [] as Instrument[] }),
      user
        ? supabase.from("observation_templates").select("*").eq("owner_id", user.id).order("favorito", { ascending: false })
        : Promise.resolve({ data: [] as ObservationTemplate[] }),
      user
        ? supabase.from("communication_templates").select("*").eq("owner_id", user.id).order("favorito", { ascending: false })
        : Promise.resolve({ data: [] as CommunicationTemplate[] }),
    ]);

  const instrumentList = (instruments as Instrument[]) ?? [];
  const observationList = (observations as ObservationTemplate[]) ?? [];
  const communicationList = (communicationTemplates as CommunicationTemplate[]) ?? [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Biblioteca de plantillas</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Todo lo que creaste para reutilizar entre secciones: instrumentos de evaluación,
          observaciones y comunicaciones. Es personal — solo vos las ves.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">
            Instrumentos de evaluación <span className="text-zinc-400">({instrumentList.length})</span>
          </h2>
          <div className="flex gap-3 text-xs font-medium">
            <Link href="/instrumentos/nuevo" className="text-teal-700 hover:underline">
              + Nuevo
            </Link>
            <Link href="/instrumentos" className="text-zinc-500 hover:underline">
              Ver todos →
            </Link>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {instrumentList.slice(0, 4).map((i) => (
            <Link
              key={i.id}
              href={`/instrumentos/${i.id}`}
              className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              <span className="font-medium text-zinc-800">{i.nombre}</span>
              <span className="flex items-center gap-2 text-xs text-zinc-400">
                {TIPO_LABEL[i.tipo as InstrumentTipo]}
                <span className={`rounded-full px-2 py-0.5 font-medium ${ESTADO_BADGE[i.estado as InstrumentEstado]}`}>
                  {ESTADO_LABEL[i.estado as InstrumentEstado]}
                </span>
              </span>
            </Link>
          ))}
          {instrumentList.length === 0 && (
            <p className="text-xs text-zinc-400">Todavía no creaste ningún instrumento.</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">
            Observaciones reutilizables <span className="text-zinc-400">({observationList.length})</span>
          </h2>
          <Link href="/observaciones" className="text-xs font-medium text-zinc-500 hover:underline">
            Ver todas →
          </Link>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {observationList.slice(0, 4).map((o) => (
            <p key={o.id} className="truncate rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              {o.favorito && <span className="mr-1 text-amber-500">★</span>}
              {o.texto}
            </p>
          ))}
          {observationList.length === 0 && (
            <p className="text-xs text-zinc-400">Todavía no guardaste ninguna observación.</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">
          Comunicaciones para encargados <span className="text-zinc-400">({communicationList.length})</span>
        </h2>
        <div className="mt-3">
          <CommunicationTemplatesManager templates={communicationList} />
        </div>
      </div>
    </div>
  );
}
