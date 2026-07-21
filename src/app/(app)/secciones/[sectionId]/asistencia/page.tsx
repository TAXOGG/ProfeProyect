import { createClient } from "@/lib/supabase/server";
import { PeriodTabs } from "@/components/period-tabs";
import { ModuleCounters } from "@/components/module-counters";
import { AttendanceSessionsManager } from "@/components/attendance-sessions-manager";
import { AttendanceGrid } from "@/components/attendance-grid";
import { moduleColor } from "@/lib/module-colors";
import type {
  AttendanceRecord,
  AttendanceSession,
  Period,
  RubricConfig,
  Student,
} from "@/lib/types";

export default async function AsistenciaPage({
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
  const studentList = (students as Student[]) ?? [];

  if (!currentPeriod) return null;

  const { data: sessions } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("period_id", currentPeriod.id)
    .order("fecha");

  const sessionList = (sessions as AttendanceSession[]) ?? [];
  const sessionIds = sessionList.map((s) => s.id);

  const { data: records } = sessionIds.length
    ? await supabase.from("attendance_records").select("*").in("session_id", sessionIds)
    : { data: [] as AttendanceRecord[] };

  const color = moduleColor("asistencia");

  return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-lg border px-4 py-3 sm:px-5 sm:py-4 ${color.headerBg} ${color.headerBorder}`}>
        <h2 className="text-lg font-semibold text-zinc-900">Asistencia</h2>
        <p className="text-sm text-zinc-600">Registra las ausencias por fecha de clase.</p>
      </div>

      <PeriodTabs
        basePath={`/secciones/${sectionId}/asistencia`}
        periods={periodList}
        currentPeriodId={currentPeriod.id}
      />

      <ModuleCounters
        items={[
          { label: "estudiantes activos", value: studentList.length },
          { label: "fechas de clase", value: sessionList.length },
        ]}
      />

      <AttendanceSessionsManager
        sectionId={sectionId}
        currentPeriod={currentPeriod}
        sessions={sessionList}
      />

      <AttendanceGrid
        sectionId={sectionId}
        students={studentList}
        sessions={sessionList}
        records={(records as AttendanceRecord[]) ?? []}
        asistenciaPct={(rubric as RubricConfig)?.asistencia_pct ?? 0}
      />
    </div>
  );
}
