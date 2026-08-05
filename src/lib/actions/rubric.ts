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
  const asistenciaNota = String(formData.get("asistencia_nota") ?? "").trim();
  const asistenciaMetodoRaw = String(formData.get("asistencia_metodo") ?? "lineal");
  const asistenciaMetodo = asistenciaMetodoRaw === "mep" ? "mep" : "lineal";

  const advertenciaRaw = String(formData.get("asistencia_advertencia_pct") ?? "").trim();
  const limiteRaw = String(formData.get("asistencia_limite_pct") ?? "").trim();
  const asistenciaAdvertencia = advertenciaRaw ? Number(advertenciaRaw) / 100 : null;
  const asistenciaLimite = limiteRaw ? Number(limiteRaw) / 100 : null;

  if (asistenciaAdvertencia !== null && (asistenciaAdvertencia < 0 || asistenciaAdvertencia > 1)) {
    throw new Error("El % de advertencia de asistencia debe estar entre 0% y 100%");
  }
  if (asistenciaLimite !== null && (asistenciaLimite < 0 || asistenciaLimite > 1)) {
    throw new Error("El % límite de asistencia debe estar entre 0% y 100%");
  }
  if (
    asistenciaAdvertencia !== null &&
    asistenciaLimite !== null &&
    asistenciaAdvertencia > asistenciaLimite
  ) {
    throw new Error("El % de advertencia (amarillo) no puede ser mayor que el % límite (rojo)");
  }

  const tardanzasRaw = String(formData.get("tardanzas_por_ausencia") ?? "").trim();
  const tardanzasPorAusencia = tardanzasRaw ? Number(tardanzasRaw) : null;
  if (
    tardanzasPorAusencia !== null &&
    (!Number.isInteger(tardanzasPorAusencia) || tardanzasPorAusencia < 1)
  ) {
    throw new Error("La cantidad de tardanzas debe ser un número entero de al menos 1");
  }

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
      asistencia_nota: asistenciaNota || null,
      asistencia_advertencia_pct: asistenciaAdvertencia,
      asistencia_limite_pct: asistenciaLimite,
      asistencia_metodo: asistenciaMetodo,
      tardanzas_por_ausencia: tardanzasPorAusencia,
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

// Bloquea nuevos cambios en notas/asistencia de este periodo (lo hacen
// cumplir triggers en la base, no solo la UI). Consultar y exportar sigue
// funcionando igual.
export async function closePeriod(sectionId: string, periodId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("periods")
    .update({
      estado: "cerrado",
      cerrado_at: new Date().toISOString(),
      cerrado_por: user?.id ?? null,
    })
    .eq("id", periodId);

  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/ajustes`);
}

// Cierra de una vez todos los periodos de la sección que todavía no están
// cerrados (para no tener que entrar a Ajustes y cerrarlos uno por uno).
export async function closeAllPeriods(sectionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("periods")
    .update({
      estado: "cerrado",
      cerrado_at: new Date().toISOString(),
      cerrado_por: user?.id ?? null,
    })
    .eq("section_id", sectionId)
    .neq("estado", "cerrado");

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath(`/secciones/${sectionId}/ajustes`);
}

export async function reopenPeriod(sectionId: string, periodId: string, formData: FormData) {
  const supabase = await createClient();
  const razon = String(formData.get("razon") ?? "").trim();
  if (!razon) throw new Error("Indicá el motivo de la reapertura.");

  const { error } = await supabase
    .from("periods")
    .update({ estado: "reabierto", razon_reapertura: razon })
    .eq("id", periodId);

  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/ajustes`);
}
