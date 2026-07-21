"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { insertWithAutoIncrementRetry } from "@/lib/insert-with-retry";

async function maxHomeworkNumero(
  supabase: Awaited<ReturnType<typeof createClient>>,
  periodId: string,
) {
  const { data } = await supabase
    .from("homework_items")
    .select("numero")
    .eq("period_id", periodId)
    .order("numero", { ascending: false })
    .limit(1)
    .single();
  return data?.numero ?? 0;
}

export async function createHomeworkItem(sectionId: string, periodId: string, formData: FormData) {
  const supabase = await createClient();

  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const fecha = String(formData.get("fecha") ?? "").trim();
  if (!descripcion) return;

  const { count } = await supabase
    .from("homework_items")
    .select("id", { count: "exact", head: true })
    .eq("period_id", periodId);

  const { error } = await insertWithAutoIncrementRetry(
    (count ?? 0) + 1,
    (numero) =>
      supabase.from("homework_items").insert({
        section_id: sectionId,
        period_id: periodId,
        numero,
        descripcion,
        fecha: fecha || null,
      }),
    () => maxHomeworkNumero(supabase, periodId),
  );

  if (error) throw new Error(error);
  revalidatePath(`/secciones/${sectionId}/tareas`);
}

export async function updateHomeworkItem(
  sectionId: string,
  homeworkId: string,
  formData: FormData,
) {
  const supabase = await createClient();

  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const fecha = String(formData.get("fecha") ?? "").trim();
  if (!descripcion) return;

  const { error } = await supabase
    .from("homework_items")
    .update({ descripcion, fecha: fecha || null })
    .eq("id", homeworkId);

  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/tareas`);
}

export async function deleteHomeworkItem(sectionId: string, homeworkId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("homework_items").delete().eq("id", homeworkId);
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/tareas`);
}

export async function upsertHomeworkScore(
  sectionId: string,
  homeworkId: string,
  studentId: string,
  nota: number,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("homework_scores")
    .upsert({ homework_id: homeworkId, student_id: studentId, nota }, { onConflict: "homework_id,student_id" });
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/tareas`);
}

export async function duplicarTareasDePeriodo(
  sectionId: string,
  fromPeriodId: string,
  toPeriodId: string,
) {
  const supabase = await createClient();

  const { data: origen, error: fetchError } = await supabase
    .from("homework_items")
    .select("numero, descripcion, fecha")
    .eq("period_id", fromPeriodId)
    .order("numero");
  if (fetchError) throw new Error(fetchError.message);
  if (!origen || origen.length === 0) return;

  const { error } = await supabase.from("homework_items").insert(
    origen.map((h) => ({
      section_id: sectionId,
      period_id: toPeriodId,
      numero: h.numero,
      descripcion: h.descripcion,
      fecha: h.fecha,
    })),
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/tareas`);
}
