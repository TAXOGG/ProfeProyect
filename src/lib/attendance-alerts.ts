import { createClient } from "@/lib/supabase/server";
import { ausenciasConTardanzas } from "@/lib/attendance-grade";
import type { SectionWithInstitution } from "@/lib/types";

export type AttendanceAlert = {
  sectionId: string;
  sectionLabel: string;
  studentId: string;
  studentName: string;
  ausenciasPct: number;
  nivel: "amarillo" | "rojo";
};

// Reutiliza los umbrales de asistencia_advertencia_pct/asistencia_limite_pct que el
// docente ya configura en Ajustes (mismo criterio que colorea la grilla de Asistencia).
// Si una sección no los tiene configurados, no participa de las alertas — es opt-in,
// igual que en Registra Profe.
export async function getAttendanceAlerts(
  sections: SectionWithInstitution[],
): Promise<AttendanceAlert[]> {
  const supabase = await createClient();
  const alerts: AttendanceAlert[] = [];

  for (const section of sections) {
    const { data: rubric } = await supabase
      .from("rubric_config")
      .select("asistencia_advertencia_pct, asistencia_limite_pct, tardanzas_por_ausencia")
      .eq("section_id", section.id)
      .single();

    if (!rubric?.asistencia_advertencia_pct) continue;

    const { data: periods } = await supabase
      .from("periods")
      .select("id, estado")
      .eq("section_id", section.id)
      .in("estado", ["activo", "reabierto"]);

    if (!periods?.length) continue;
    const periodIds = periods.map((p) => p.id);

    const [{ data: students }, { data: sessions }] = await Promise.all([
      supabase
        .from("students")
        .select("id, primer_apellido, segundo_apellido, nombre")
        .eq("section_id", section.id)
        .eq("estado", "activo")
        .is("deleted_at", null),
      supabase
        .from("attendance_sessions")
        .select("id, lecciones_impartidas")
        .in("period_id", periodIds),
    ]);

    if (!students?.length || !sessions?.length) continue;

    const totalLecciones = sessions.reduce((sum, s) => sum + s.lecciones_impartidas, 0);
    if (totalLecciones === 0) continue;

    const { data: records } = await supabase
      .from("attendance_records")
      .select("session_id, student_id, ausencias, justificada, tardia")
      .in(
        "session_id",
        sessions.map((s) => s.id),
      );

    for (const student of students) {
      const studentRecords = (records ?? []).filter((r) => r.student_id === student.id);
      const ausenciasInjustificadas = studentRecords
        .filter((r) => !r.justificada)
        .reduce((sum, r) => sum + r.ausencias, 0);
      const cantidadTardanzas = studentRecords.filter((r) => r.tardia).length;
      const ausenciasEfectivas = ausenciasConTardanzas(
        ausenciasInjustificadas,
        cantidadTardanzas,
        rubric.tardanzas_por_ausencia,
      );
      const ausenciasPct = (ausenciasEfectivas / totalLecciones) * 100;

      const limitePct = rubric.asistencia_limite_pct;
      const advertenciaPct = rubric.asistencia_advertencia_pct;
      const nivel: AttendanceAlert["nivel"] | null =
        limitePct != null && ausenciasPct >= limitePct * 100
          ? "rojo"
          : ausenciasPct >= advertenciaPct * 100
            ? "amarillo"
            : null;

      if (!nivel) continue;

      alerts.push({
        sectionId: section.id,
        sectionLabel: `${section.asignatura} — ${section.nombre}`,
        studentId: student.id,
        studentName: `${student.primer_apellido} ${student.segundo_apellido ?? ""} ${student.nombre}`
          .replace(/\s+/g, " ")
          .trim(),
        ausenciasPct,
        nivel,
      });
    }
  }

  alerts.sort((a, b) => b.ausenciasPct - a.ausenciasPct);
  return alerts;
}
