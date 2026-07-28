import { createClient } from "@/lib/supabase/server";
import { AjustesForm } from "@/components/ajustes-form";
import { PeriodStateCard } from "@/components/period-state-card";
import { ArchiveSectionCard } from "@/components/archive-section-card";
import { moduleColor } from "@/lib/module-colors";
import type { RubricConfig, Period } from "@/lib/types";

export default async function AjustesPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  const supabase = await createClient();

  const [{ data: section }, { data: rubric }, { data: periods }] = await Promise.all([
    supabase.from("sections").select("nota_minima").eq("id", sectionId).single(),
    supabase.from("rubric_config").select("*").eq("section_id", sectionId).single(),
    supabase.from("periods").select("*").eq("section_id", sectionId).order("numero"),
  ]);

  if (!section || !rubric) return null;

  const periodList = (periods as Period[]) ?? [];
  const cerradoPorIds = [
    ...new Set(periodList.map((p) => p.cerrado_por).filter((v): v is string => !!v)),
  ];
  const { data: profiles } =
    cerradoPorIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", cerradoPorIds)
      : { data: [] as { id: string; full_name: string | null }[] };
  const nameByUserId = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const cerradoPorNombre: Record<string, string> = {};
  for (const p of periodList) {
    if (p.cerrado_por) cerradoPorNombre[p.id] = nameByUserId.get(p.cerrado_por) ?? "un docente";
  }

  const color = moduleColor("ajustes");

  return (
    <div>
      <div className={`rounded-lg border px-4 py-3 sm:px-5 sm:py-4 ${color.headerBg} ${color.headerBorder}`}>
        <h2 className="text-lg font-semibold text-zinc-900">Ajustes</h2>
        <p className="text-sm text-zinc-600">
          Configura los rubros de evaluación y la nota mínima de esta sección.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-8">
        <AjustesForm
          sectionId={sectionId}
          notaMinima={section.nota_minima}
          rubric={rubric as RubricConfig}
          periods={periodList}
        />

        <PeriodStateCard
          sectionId={sectionId}
          periods={periodList}
          cerradoPorNombre={cerradoPorNombre}
        />
      </div>

      <ArchiveSectionCard sectionId={sectionId} />
    </div>
  );
}
