import { createClient } from "@/lib/supabase/server";
import { PeriodTabs } from "@/components/period-tabs";
import { ModuleCounters } from "@/components/module-counters";
import { ExamsManager } from "@/components/exams-manager";
import { PruebasGrid } from "@/components/pruebas-grid";
import { moduleColor } from "@/lib/module-colors";
import type { Exam, ExamScore, Period, RubricConfig, Student } from "@/lib/types";

export default async function PruebasPage({
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

  const [{ data: exams }, otherCount] = await Promise.all([
    supabase.from("exams").select("*").eq("period_id", currentPeriod.id).order("numero"),
    otherPeriod
      ? supabase
          .from("exams")
          .select("id", { count: "exact", head: true })
          .eq("period_id", otherPeriod.id)
      : Promise.resolve({ count: 0 }),
  ]);

  const examList = (exams as Exam[]) ?? [];
  const examIds = examList.map((e) => e.id);
  const otherPeriodHasExams = (otherCount.count ?? 0) > 0;

  const { data: scores } = examIds.length
    ? await supabase.from("exam_scores").select("*").in("exam_id", examIds)
    : { data: [] as ExamScore[] };

  const color = moduleColor("pruebas");

  return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-lg border px-4 py-3 sm:px-5 sm:py-4 ${color.headerBg} ${color.headerBorder}`}>
        <h2 className="text-lg font-semibold text-zinc-900">Pruebas</h2>
        <p className="text-sm text-zinc-600">Registra los puntos obtenidos en cada prueba.</p>
      </div>

      <PeriodTabs
        basePath={`/secciones/${sectionId}/pruebas`}
        periods={periodList}
        currentPeriodId={currentPeriod.id}
      />

      <ModuleCounters
        items={[
          { label: "estudiantes activos", value: studentList.length },
          { label: "pruebas", value: examList.length },
        ]}
      />

      <ExamsManager
        sectionId={sectionId}
        currentPeriod={currentPeriod}
        otherPeriod={otherPeriod}
        exams={examList}
        otherPeriodHasExams={otherPeriodHasExams}
      />

      <PruebasGrid
        sectionId={sectionId}
        students={studentList}
        exams={examList}
        scores={(scores as ExamScore[]) ?? []}
        pruebasPct={(rubric as RubricConfig)?.pruebas_pct ?? 0}
        tolerancePct={(rubric as RubricConfig)?.tolerancia_pct ?? 0.1}
      />
    </div>
  );
}
