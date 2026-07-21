import { createClient } from "@/lib/supabase/server";
import { AjustesForm } from "@/components/ajustes-form";
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

  const color = moduleColor("ajustes");

  return (
    <div>
      <div className={`rounded-lg border px-4 py-3 sm:px-5 sm:py-4 ${color.headerBg} ${color.headerBorder}`}>
        <h2 className="text-lg font-semibold text-zinc-900">Ajustes</h2>
        <p className="text-sm text-zinc-600">
          Configura los rubros de evaluación y la nota mínima de esta sección.
        </p>
      </div>

      <div className="mt-4">
        <AjustesForm
          sectionId={sectionId}
          notaMinima={section.nota_minima}
          rubric={rubric as RubricConfig}
          periods={(periods as Period[]) ?? []}
        />
      </div>

      <ArchiveSectionCard sectionId={sectionId} />
    </div>
  );
}
