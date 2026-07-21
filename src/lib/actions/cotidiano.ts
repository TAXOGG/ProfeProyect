"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { insertWithAutoIncrementRetry } from "@/lib/insert-with-retry";

async function maxIndicadorNumero(
  supabase: Awaited<ReturnType<typeof createClient>>,
  periodId: string,
) {
  const { data } = await supabase
    .from("cotidiano_indicators")
    .select("numero")
    .eq("period_id", periodId)
    .order("numero", { ascending: false })
    .limit(1)
    .single();
  return data?.numero ?? 0;
}

export async function createIndicador(sectionId: string, periodId: string, formData: FormData) {
  const supabase = await createClient();

  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const fechaAplicacion = String(formData.get("fecha_aplicacion") ?? "").trim();
  const puntosMax = Number(formData.get("puntos_max") ?? 3);
  if (!descripcion) return;

  const { count } = await supabase
    .from("cotidiano_indicators")
    .select("id", { count: "exact", head: true })
    .eq("period_id", periodId);

  const { error } = await insertWithAutoIncrementRetry(
    (count ?? 0) + 1,
    (numero) =>
      supabase.from("cotidiano_indicators").insert({
        section_id: sectionId,
        period_id: periodId,
        numero,
        descripcion,
        fecha_aplicacion: fechaAplicacion || null,
        puntos_max: puntosMax,
      }),
    () => maxIndicadorNumero(supabase, periodId),
  );

  if (error) throw new Error(error);
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
