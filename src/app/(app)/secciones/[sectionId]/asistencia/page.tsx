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
  const rubricConfig = rubric as RubricConfig | null;
  const advertenciaPct = rubricConfig?.asistencia_advertencia_pct ?? null;
  const limitePct = rubricConfig?.asistencia_limite_pct ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-lg border px-4 py-3 sm:px-5 sm:py-4 ${color.headerBg} ${color.headerBorder}`}>
        <h2 className="text-lg font-semibold text-zinc-900">Asistencia</h2>
        <p className="text-sm text-zinc-600">Registra las ausencias por fecha de clase.</p>
        {rubricConfig?.asistencia_metodo === "mep" && (
          <p className="mt-1 text-xs font-medium text-teal-700">
            Calculando con la tabla oficial del MEP (Art. 37° del Reglamento de Evaluación).
          </p>
        )}
      </div>

      {limitePct != null && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-xs text-zinc-600">
          <span className="font-medium text-zinc-500">Código de color por ausencias:</span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-zinc-300 bg-white" /> Va bien
          </span>
          {advertenciaPct != null && (
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-amber-200" /> Se acerca al límite (≥
              {(advertenciaPct * 100).toFixed(0)}%)
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-red-300" /> Superó el límite (≥
            {(limitePct * 100).toFixed(0)}%)
          </span>
        </div>
      )}

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
        asistenciaPct={rubricConfig?.asistencia_pct ?? 0}
        advertenciaPct={advertenciaPct}
        limitePct={limitePct}
        asistenciaMetodo={rubricConfig?.asistencia_metodo ?? "lineal"}
      />
    </div>
  );
}
