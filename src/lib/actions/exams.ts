"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createExam(sectionId: string, periodId: string, formData: FormData) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("exams")
    .select("id", { count: "exact", head: true })
    .eq("period_id", periodId);

  const nombre = String(formData.get("nombre") ?? "").trim();
  const puntosMax = Number(formData.get("puntos_max") ?? 0);
  const peso = Number(formData.get("peso_pct") ?? 0) / 100;
  if (!nombre || puntosMax <= 0) return;

  const { error } = await supabase.from("exams").insert({
    section_id: sectionId,
    period_id: periodId,
    numero: (count ?? 0) + 1,
    nombre,
    puntos_max: puntosMax,
    porcentaje_relativo: peso,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/pruebas`);
}

export async function updateExam(sectionId: string, examId: string, formData: FormData) {
  const supabase = await createClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const puntosMax = Number(formData.get("puntos_max") ?? 0);
  const peso = Number(formData.get("peso_pct") ?? 0) / 100;
  if (!nombre || puntosMax <= 0) return;

  const { error } = await supabase
    .from("exams")
    .update({ nombre, puntos_max: puntosMax, porcentaje_relativo: peso })
    .eq("id", examId);

  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/pruebas`);
}

export async function deleteExam(sectionId: string, examId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("exams").delete().eq("id", examId);
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/pruebas`);
}

export async function upsertExamScore(
  sectionId: string,
  examId: string,
  studentId: string,
  puntosObtenidos: number,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("exam_scores")
    .upsert(
      { exam_id: examId, student_id: studentId, puntos_obtenidos: puntosObtenidos },
      { onConflict: "exam_id,student_id" },
    );
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/pruebas`);
}

export async function duplicarExamenesDePeriodo(
  sectionId: string,
  fromPeriodId: string,
  toPeriodId: string,
) {
  const supabase = await createClient();

  const { data: origen, error: fetchError } = await supabase
    .from("exams")
    .select("numero, nombre, puntos_max, porcentaje_relativo")
    .eq("period_id", fromPeriodId)
    .order("numero");
  if (fetchError) throw new Error(fetchError.message);
  if (!origen || origen.length === 0) return;

  const { error } = await supabase.from("exams").insert(
    origen.map((e) => ({
      section_id: sectionId,
      period_id: toPeriodId,
      numero: e.numero,
      nombre: e.nombre,
      puntos_max: e.puntos_max,
      porcentaje_relativo: e.porcentaje_relativo,
    })),
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/pruebas`);
}
