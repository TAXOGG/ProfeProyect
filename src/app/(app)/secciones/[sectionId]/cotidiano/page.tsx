import { createClient } from "@/lib/supabase/server";
import { PeriodTabs } from "@/components/period-tabs";
import { ModuleCounters } from "@/components/module-counters";
import { CotidianoIndicatorsManager } from "@/components/cotidiano-indicators-manager";
import { CotidianoGrid } from "@/components/cotidiano-grid";
import { moduleColor } from "@/lib/module-colors";
import type {
  CotidianoIndicator,
  CotidianoScore,
  Period,
  RubricConfig,
  Student,
} from "@/lib/types";

export default async function CotidianoPage({
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

  const [{ data: indicators }, otherCount] = await Promise.all([
    supabase
      .from("cotidiano_indicators")
      .select("*")
      .eq("period_id", currentPeriod.id)
      .order("numero"),
    otherPeriod
      ? supabase
          .from("cotidiano_indicators")
          .select("id", { count: "exact", head: true })
          .eq("period_id", otherPeriod.id)
      : Promise.resolve({ count: 0 }),
  ]);

  const indicatorList = (indicators as CotidianoIndicator[]) ?? [];
  const indicatorIds = indicatorList.map((i) => i.id);
  const otherPeriodHasIndicators = (otherCount.count ?? 0) > 0;

  const { data: scores } = indicatorIds.length
    ? await supabase.from("cotidiano_scores").select("*").in("indicator_id", indicatorIds)
    : { data: [] as CotidianoScore[] };

  const color = moduleColor("cotidiano");

  return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-lg border px-4 py-3 sm:px-5 sm:py-4 ${color.headerBg} ${color.headerBorder}`}>
        <h2 className="text-lg font-semibold text-zinc-900">Trabajo Cotidiano</h2>
        <p className="text-sm text-zinc-600">
          Registra el nivel de desempeño de cada estudiante por indicador.
        </p>
      </div>

      <PeriodTabs
        basePath={`/secciones/${sectionId}/cotidiano`}
        periods={periodList}
        currentPeriodId={currentPeriod.id}
      />

      <ModuleCounters
        items={[
          { label: "estudiantes activos", value: studentList.length },
          { label: "indicadores", value: indicatorList.length },
        ]}
      />

      <CotidianoIndicatorsManager
        sectionId={sectionId}
        currentPeriod={currentPeriod}
        otherPeriod={otherPeriod}
        indicators={indicatorList}
        otherPeriodHasIndicators={otherPeriodHasIndicators}
      />

      <CotidianoGrid
        sectionId={sectionId}
        students={studentList}
        indicators={indicatorList}
        scores={(scores as CotidianoScore[]) ?? []}
        cotidianoPct={(rubric as RubricConfig)?.cotidiano_pct ?? 0}
        tolerancePct={(rubric as RubricConfig)?.tolerancia_pct ?? 0.1}
      />
    </div>
  );
}
