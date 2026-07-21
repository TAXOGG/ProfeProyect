import { createClient } from "@/lib/supabase/server";
import { PeriodTabs } from "@/components/period-tabs";
import { ModuleCounters } from "@/components/module-counters";
import { HomeworkManager } from "@/components/homework-manager";
import { TareasGrid } from "@/components/tareas-grid";
import { moduleColor } from "@/lib/module-colors";
import type { HomeworkItem, HomeworkScore, Period, RubricConfig, Student } from "@/lib/types";

export default async function TareasPage({
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

  const [{ data: items }, otherCount] = await Promise.all([
    supabase.from("homework_items").select("*").eq("period_id", currentPeriod.id).order("numero"),
    otherPeriod
      ? supabase
          .from("homework_items")
          .select("id", { count: "exact", head: true })
          .eq("period_id", otherPeriod.id)
      : Promise.resolve({ count: 0 }),
  ]);

  const itemList = (items as HomeworkItem[]) ?? [];
  const itemIds = itemList.map((i) => i.id);
  const otherPeriodHasItems = (otherCount.count ?? 0) > 0;

  const { data: scores } = itemIds.length
    ? await supabase.from("homework_scores").select("*").in("homework_id", itemIds)
    : { data: [] as HomeworkScore[] };

  const color = moduleColor("tareas");

  return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-lg border px-4 py-3 sm:px-5 sm:py-4 ${color.headerBg} ${color.headerBorder}`}>
        <h2 className="text-lg font-semibold text-zinc-900">Tareas</h2>
        <p className="text-sm text-zinc-600">
          Registra la nota (0-100) de cada tarea asignada.
        </p>
      </div>

      <PeriodTabs
        basePath={`/secciones/${sectionId}/tareas`}
        periods={periodList}
        currentPeriodId={currentPeriod.id}
      />

      <ModuleCounters
        items={[
          { label: "estudiantes activos", value: studentList.length },
          { label: "tareas", value: itemList.length },
        ]}
      />

      <HomeworkManager
        sectionId={sectionId}
        currentPeriod={currentPeriod}
        otherPeriod={otherPeriod}
        items={itemList}
        otherPeriodHasItems={otherPeriodHasItems}
      />

      <TareasGrid
        sectionId={sectionId}
        students={studentList}
        items={itemList}
        scores={(scores as HomeworkScore[]) ?? []}
        tareasPct={(rubric as RubricConfig)?.tareas_pct ?? 0}
      />
    </div>
  );
}
