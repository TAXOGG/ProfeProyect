"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseAttendanceInput } from "@/lib/attendance-parse";
import { DIAS_SEMANA } from "@/lib/weekdays";

export async function createSession(sectionId: string, periodId: string, formData: FormData) {
  const supabase = await createClient();

  const fecha = String(formData.get("fecha") ?? "").trim();
  const lecciones = Number(formData.get("lecciones_impartidas") ?? 1);
  if (!fecha || lecciones <= 0) return;

  const { error } = await supabase.from("attendance_sessions").insert({
    section_id: sectionId,
    period_id: periodId,
    fecha,
    lecciones_impartidas: lecciones,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/asistencia`);
}

export async function updateSession(sectionId: string, sessionId: string, formData: FormData) {
  const supabase = await createClient();

  const fecha = String(formData.get("fecha") ?? "").trim();
  const lecciones = Number(formData.get("lecciones_impartidas") ?? 1);
  if (!fecha || lecciones <= 0) return;

  const { error } = await supabase
    .from("attendance_sessions")
    .update({ fecha, lecciones_impartidas: lecciones })
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/asistencia`);
}

export async function deleteSession(sectionId: string, sessionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("attendance_sessions").delete().eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/asistencia`);
}

function formatDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type GenerateSessionsResult = {
  error?: string;
  success?: boolean;
  created?: number;
  skipped?: number;
};

export async function generateWeeklySessions(
  sectionId: string,
  periodId: string,
  formData: FormData,
): Promise<GenerateSessionsResult> {
  const supabase = await createClient();

  const fechaInicio = String(formData.get("fecha_inicio") ?? "").trim();
  const fechaFin = String(formData.get("fecha_fin") ?? "").trim();
  if (!fechaInicio || !fechaFin) {
    return { error: "Indica la fecha de inicio y la fecha de fin." };
  }

  const start = new Date(`${fechaInicio}T00:00:00`);
  const end = new Date(`${fechaFin}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return { error: "El rango de fechas no es válido." };
  }
  const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 366) {
    return { error: "El rango no puede superar un año." };
  }

  const leccionesPorDia = new Map<number, number>(
    DIAS_SEMANA.map((d) => [d.dow, Math.max(0, Number(formData.get(d.key) ?? 0))]),
  );
  if (![...leccionesPorDia.values()].some((v) => v > 0)) {
    return { error: "Indica cuántas lecciones da al menos un día de la semana." };
  }

  const { data: existing } = await supabase
    .from("attendance_sessions")
    .select("fecha")
    .eq("period_id", periodId);
  const existingDates = new Set((existing ?? []).map((r) => r.fecha as string));

  const toInsert: {
    section_id: string;
    period_id: string;
    fecha: string;
    lecciones_impartidas: number;
  }[] = [];
  let skipped = 0;

  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const lecciones = leccionesPorDia.get(d.getDay()) ?? 0;
    if (!lecciones) continue;
    const fecha = formatDateLocal(d);
    if (existingDates.has(fecha)) {
      skipped++;
      continue;
    }
    toInsert.push({ section_id: sectionId, period_id: periodId, fecha, lecciones_impartidas: lecciones });
    existingDates.add(fecha);
  }

  if (toInsert.length === 0) {
    return {
      error:
        skipped > 0
          ? "Todas las fechas de ese horario ya estaban agregadas."
          : "Ese horario no generó ninguna fecha en el rango indicado.",
    };
  }

  const { error } = await supabase.from("attendance_sessions").insert(toInsert);
  if (error) return { error: error.message };

  revalidatePath(`/secciones/${sectionId}/asistencia`);
  return { success: true, created: toInsert.length, skipped };
}

export async function upsertRecord(
  sectionId: string,
  sessionId: string,
  studentId: string,
  raw: string,
) {
  const supabase = await createClient();
  const { ausencias, justificada, tardia } = parseAttendanceInput(raw);

  const { error } = await supabase
    .from("attendance_records")
    .upsert(
      { session_id: sessionId, student_id: studentId, ausencias, justificada, tardia },
      { onConflict: "session_id,student_id" },
    );
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/asistencia`);
}
