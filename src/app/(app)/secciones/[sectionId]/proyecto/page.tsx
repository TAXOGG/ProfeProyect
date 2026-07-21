import { createClient } from "@/lib/supabase/server";
import { PeriodTabs } from "@/components/period-tabs";
import { ModuleCounters } from "@/components/module-counters";
import { ProjectStagesManager } from "@/components/project-stages-manager";
import { ProyectoGrid } from "@/components/proyecto-grid";
import { moduleColor } from "@/lib/module-colors";
import type { Period, ProjectScore, ProjectStage, RubricConfig, Student } from "@/lib/types";

export default async function ProyectoPage({
  params,
  searchParams,
}: {
  params: Promise<{ sectionId: string }>;
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { sectionId } = await params;
  const { periodo } = await searchParams;
  const supabase = await createClient();

  const [{ data: periods }, { data: rubric }, { data: students }] = await Promise.all([
    supabase.from("periods").select("*").eq("section_id", sectionId).order("numero"),
    supabase.from("rubric_config").select("*").eq("section_id", sectionId).single(),
    supabase
      .from("students")
      .select("*")
      .eq("section_id", sectionId)
      .eq("estado", "activo")
      .order("numero"),
  ]);

  const periodList = (periods as Period[]) ?? [];
  const currentPeriod = periodList.find((p) => p.id === periodo) ?? periodList[0];
  const otherPeriod = periodList.find((p) => p.id !== currentPeriod?.id) ?? null;
  const studentList = (students as Student[]) ?? [];

  if (!currentPeriod) return null;

  const [{ data: stages }, otherCount] = await Promise.all([
    supabase.from("project_stages").select("*").eq("period_id", currentPeriod.id),
    otherPeriod
      ? supabase
          .from("project_stages")
          .select("id", { count: "exact", head: true })
          .eq("period_id", otherPeriod.id)
      : Promise.resolve({ count: 0 }),
  ]);

  const stageList = (stages as ProjectStage[]) ?? [];
  const stageIds = stageList.map((e) => e.id);
  const otherPeriodHasStages = (otherCount.count ?? 0) > 0;

  const { data: scores } = stageIds.length
    ? await supabase.from("project_scores").select("*").in("stage_id", stageIds)
    : { data: [] as ProjectScore[] };

  const color = moduleColor("proyecto");

  return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-lg border px-4 py-3 sm:px-5 sm:py-4 ${color.headerBg} ${color.headerBorder}`}>
        <h2 className="text-lg font-semibold text-zinc-900">Proyecto</h2>
        <p className="text-sm text-zinc-600">
          Registra los puntos obtenidos en cada etapa del proyecto.
        </p>
      </div>

      <PeriodTabs
        basePath={`/secciones/${sectionId}/proyecto`}
        periods={periodList}
        currentPeriodId={currentPeriod.id}
      />

      <ModuleCounters
        items={[
          { label: "estudiantes activos", value: studentList.length },
          { label: "etapas", value: stageList.length },
        ]}
      />

      <ProjectStagesManager
        sectionId={sectionId}
        currentPeriod={currentPeriod}
        otherPeriod={otherPeriod}
        stages={stageList}
        otherPeriodHasStages={otherPeriodHasStages}
      />

      <ProyectoGrid
        sectionId={sectionId}
        students={studentList}
        stages={stageList}
        scores={(scores as ProjectScore[]) ?? []}
        proyectoPct={(rubric as RubricConfig)?.proyecto_pct ?? 0}
        tolerancePct={(rubric as RubricConfig)?.tolerancia_pct ?? 0.1}
      />
    </div>
  );
}
