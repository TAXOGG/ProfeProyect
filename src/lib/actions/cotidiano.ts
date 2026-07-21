"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createIndicador(sectionId: string, periodId: string, formData: FormData) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("cotidiano_indicators")
    .select("id", { count: "exact", head: true })
    .eq("period_id", periodId);

  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const fechaAplicacion = String(formData.get("fecha_aplicacion") ?? "").trim();
  const puntosMax = Number(formData.get("puntos_max") ?? 3);
  if (!descripcion) return;

  const { error } = await supabase.from("cotidiano_indicators").insert({
    section_id: sectionId,
    period_id: periodId,
    numero: (count ?? 0) + 1,
    descripcion,
    fecha_aplicacion: fechaAplicacion || null,
    puntos_max: puntosMax,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/cotidiano`);
}

export async function updateIndicador(
  sectionId: string,
  indicatorId: string,
  formData: FormData,
) {
  const supabase = await createClient();

  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const fechaAplicacion = String(formData.get("fecha_aplicacion") ?? "").trim();
  const puntosMax = Number(formData.get("puntos_max") ?? 3);
  if (!descripcion) return;

  const { error } = await supabase
    .from("cotidiano_indicators")
    .update({
      descripcion,
      fecha_aplicacion: fechaAplicacion || null,
      puntos_max: puntosMax,
    })
    .eq("id", indicatorId);

  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/cotidiano`);
}

export async function deleteIndicador(sectionId: string, indicatorId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cotidiano_indicators").delete().eq("id", indicatorId);
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/cotidiano`);
}

export async function upsertPuntaje(
  sectionId: string,
  indicatorId: string,
  studentId: string,
  puntaje: number,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cotidiano_scores")
    .upsert(
      { indicator_id: indicatorId, student_id: studentId, puntaje },
      { onConflict: "indicator_id,student_id" },
    );
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/cotidiano`);
}

export async function duplicarIndicadoresDePeriodo(
  sectionId: string,
  fromPeriodId: string,
  toPeriodId: string,
) {
  const supabase = await createClient();

  const { data: origen, error: fetchError } = await supabase
    .from("cotidiano_indicators")
    .select("numero, descripcion, puntos_max")
    .eq("period_id", fromPeriodId)
    .order("numero");
  if (fetchError) throw new Error(fetchError.message);
  if (!origen || origen.length === 0) return;

  const { error } = await supabase.from("cotidiano_indicators").insert(
    origen.map((i) => ({
      section_id: sectionId,
      period_id: toPeriodId,
      numero: i.numero,
      descripcion: i.descripcion,
      puntos_max: i.puntos_max,
    })),
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/cotidiano`);
}
