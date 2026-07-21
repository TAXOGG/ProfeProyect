"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createStage(sectionId: string, periodId: string, formData: FormData) {
  const supabase = await createClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const puntosMax = Number(formData.get("puntos_max") ?? 0);
  if (!nombre || puntosMax <= 0) return;

  const { error } = await supabase.from("project_stages").insert({
    section_id: sectionId,
    period_id: periodId,
    nombre,
    puntos_max: puntosMax,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/proyecto`);
}

export async function updateStage(sectionId: string, stageId: string, formData: FormData) {
  const supabase = await createClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const puntosMax = Number(formData.get("puntos_max") ?? 0);
  if (!nombre || puntosMax <= 0) return;

  const { error } = await supabase
    .from("project_stages")
    .update({ nombre, puntos_max: puntosMax })
    .eq("id", stageId);

  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/proyecto`);
}

export async function deleteStage(sectionId: string, stageId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("project_stages").delete().eq("id", stageId);
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/proyecto`);
}

export async function upsertStageScore(
  sectionId: string,
  stageId: string,
  studentId: string,
  puntosObtenidos: number,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_scores")
    .upsert(
      { stage_id: stageId, student_id: studentId, puntos_obtenidos: puntosObtenidos },
      { onConflict: "stage_id,student_id" },
    );
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/proyecto`);
}

export async function duplicarEtapasDePeriodo(
  sectionId: string,
  fromPeriodId: string,
  toPeriodId: string,
) {
  const supabase = await createClient();

  const { data: origen, error: fetchError } = await supabase
    .from("project_stages")
    .select("nombre, puntos_max")
    .eq("period_id", fromPeriodId);
  if (fetchError) throw new Error(fetchError.message);
  if (!origen || origen.length === 0) return;

  const { error } = await supabase.from("project_stages").insert(
    origen.map((e) => ({
      section_id: sectionId,
      period_id: toPeriodId,
      nombre: e.nombre,
      puntos_max: e.puntos_max,
    })),
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/proyecto`);
}
