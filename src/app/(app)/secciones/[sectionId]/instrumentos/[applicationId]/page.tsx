import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { InstrumentGradingPager } from "@/components/instrument-grading-pager";
import { TIPO_LABEL } from "@/lib/instrument-labels";
import type {
  Instrument,
  InstrumentCriterio,
  InstrumentNivel,
  InstrumentResult,
  InstrumentTipo,
  ObservationTemplate,
  Student,
  StudentPhoto,
} from "@/lib/types";

const BUCKET = "student-photos";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export default async function AplicacionPage({
  params,
}: {
  params: Promise<{ sectionId: string; applicationId: string }>;
}) {
  const { sectionId, applicationId } = await params;
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("instrument_applications")
    .select("*, instruments ( * )")
    .eq("id", applicationId)
    .single();

  if (!application) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-sm text-zinc-500">
        No se encontró esta aplicación.
      </div>
    );
  }

  const instrument = application.instruments as unknown as Instrument;
  const user = await getCurrentUser();

  const [{ data: criteria }, { data: students }, { data: results }, { data: section }, { data: period }, { data: observations }] =
    await Promise.all([
      supabase
        .from("instrument_criteria")
        .select("*")
        .eq("instrument_id", instrument.id)
        .order("orden"),
      supabase
        .from("students")
        .select("*")
        .eq("section_id", sectionId)
        .eq("estado", "activo")
        .is("deleted_at", null)
        .order("numero"),
      supabase.from("instrument_results").select("*").eq("application_id", applicationId),
      supabase.from("sections").select("nombre, asignatura").eq("id", sectionId).single(),
      supabase.from("periods").select("nombre").eq("id", application.period_id).single(),
      user
        ? supabase.from("observation_templates").select("*").eq("owner_id", user.id).order("favorito", { ascending: false })
        : Promise.resolve({ data: [] as ObservationTemplate[] }),
    ]);

  const sec = section as { nombre: string; asignatura: string } | null;
  const per = period as { nombre: string } | null;

  const criteriaList = (criteria as InstrumentCriterio[]) ?? [];
  const criteriaIds = criteriaList.map((c) => c.id);
  const { data: levels } =
    criteriaIds.length > 0
      ? await supabase.from("instrument_levels").select("*").in("criterio_id", criteriaIds).order("orden")
      : { data: [] as InstrumentNivel[] };

  const resultIds = ((results as InstrumentResult[]) ?? []).map((r) => r.id);
  const { data: evidence } =
    resultIds.length > 0
      ? await supabase
          .from("student_photos")
          .select("*")
          .in("instrument_result_id", resultIds)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
      : { data: [] as StudentPhoto[] };

  const evidenceList = (evidence as StudentPhoto[]) ?? [];
  const evidencePaths = evidenceList.map((p) => p.storage_path);
  let evidenceSignedUrlByPath: Record<string, string> = {};
  if (evidencePaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(evidencePaths, SIGNED_URL_TTL_SECONDS);
    evidenceSignedUrlByPath = Object.fromEntries(
      (signed ?? []).filter((s) => s.signedUrl).map((s) => [s.path, s.signedUrl as string]),
    );
  }
  const evidenceByResultId: Record<string, (StudentPhoto & { url: string | null })[]> = {};
  for (const p of evidenceList) {
    if (!p.instrument_result_id) continue;
    const withUrl = { ...p, url: evidenceSignedUrlByPath[p.storage_path] ?? null };
    (evidenceByResultId[p.instrument_result_id] ??= []).push(withUrl);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href={`/secciones/${sectionId}/instrumentos`}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
        >
          ← Volver a Instrumentos
        </Link>
        <h2 className="mt-2 text-lg font-semibold text-zinc-900">{instrument.nombre}</h2>
        <p className="text-sm text-zinc-600">
          {TIPO_LABEL[instrument.tipo as InstrumentTipo]} · {application.fecha}
        </p>
      </div>

      <InstrumentGradingPager
        sectionId={sectionId}
        applicationId={applicationId}
        tipo={instrument.tipo as InstrumentTipo}
        criteria={criteriaList}
        levels={(levels as InstrumentNivel[]) ?? []}
        students={(students as Student[]) ?? []}
        initialResults={(results as InstrumentResult[]) ?? []}
        observations={(observations as ObservationTemplate[]) ?? []}
        observationContext={{
          grupo: sec?.nombre,
          materia: instrument.materia ?? sec?.asignatura,
          periodo: per?.nombre,
        }}
        evidenceByResultId={evidenceByResultId}
      />
    </div>
  );
}
