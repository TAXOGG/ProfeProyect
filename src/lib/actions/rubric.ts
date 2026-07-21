"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateRubric(sectionId: string, formData: FormData) {
  const supabase = await createClient();

  const cotidiano = Number(formData.get("cotidiano_pct")) / 100;
  const tareas = Number(formData.get("tareas_pct")) / 100;
  const asistencia = Number(formData.get("asistencia_pct")) / 100;
  const proyecto = Number(formData.get("proyecto_pct")) / 100;
  const pruebas = Number(formData.get("pruebas_pct")) / 100;
  const tolerancia = Number(formData.get("tolerancia_pct")) / 100;
  const notaMinima = Number(formData.get("nota_minima"));

  const total = cotidiano + tareas + asistencia + proyecto + pruebas;
  if (Math.abs(total - 1) > 0.001) {
    throw new Error(`Los porcentajes deben sumar 100% (suman ${(total * 100).toFixed(1)}%)`);
  }
  if (tolerancia < 0 || tolerancia > 1) {
    throw new Error("La tolerancia debe estar entre 0% y 100%");
  }

  const { error: rubricError } = await supabase
    .from("rubric_config")
    .update({
      cotidiano_pct: cotidiano,
      tareas_pct: tareas,
      asistencia_pct: asistencia,
      proyecto_pct: proyecto,
      pruebas_pct: pruebas,
      tolerancia_pct: tolerancia,
    })
    .eq("section_id", sectionId);
  if (rubricError) throw new Error(rubricError.message);

  const { error: sectionError } = await supabase
    .from("sections")
    .update({ nota_minima: notaMinima })
    .eq("id", sectionId);
  if (sectionError) throw new Error(sectionError.message);

  revalidatePath(`/secciones/${sectionId}/ajustes`);
}

export async function updatePeriodWeights(sectionId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: periods } = await supabase
    .from("periods")
    .select("id, numero")
    .eq("section_id", sectionId)
    .order("numero");

  if (!periods) return;

  const weights = periods.map((period) => ({
    id: period.id,
    pct: Number(formData.get(`periodo_${period.numero}_pct`)) / 100,
  }));

  const total = weights.reduce((sum, w) => sum + w.pct, 0);
  if (Math.abs(total - 1) > 0.001) {
    throw new Error(`Los porcentajes de periodo deben sumar 100% (suman ${(total * 100).toFixed(1)}%)`);
  }

  for (const w of weights) {
    await supabase.from("periods").update({ porcentaje: w.pct }).eq("id", w.id);
  }

  revalidatePath(`/secciones/${sectionId}/ajustes`);
}
