"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function archiveSection(sectionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sections")
    .update({ archivada: true })
    .eq("id", sectionId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/secciones/archivadas");
  redirect("/dashboard");
}

export async function unarchiveSection(sectionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sections")
    .update({ archivada: false })
    .eq("id", sectionId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/secciones/archivadas");
}

export async function deleteSectionPermanently(sectionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("sections").delete().eq("id", sectionId);
  if (error) throw new Error(error.message);
  revalidatePath("/secciones/archivadas");
}

async function findOrCreateInstitution(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nombre: string,
  direccionRegional: string,
  circuito: string,
  provincia: string,
  canton: string,
) {
  const { data: existente } = await supabase
    .from("institutions")
    .select("id")
    .ilike("nombre", nombre)
    .limit(1)
    .maybeSingle();

  if (existente) return existente.id;

  const { data: nueva, error } = await supabase
    .from("institutions")
    .insert({
      nombre,
      direccion_regional: direccionRegional || null,
      circuito: circuito || null,
      provincia: provincia || null,
      canton: canton || null,
    })
    .select("id")
    .single();

  if (error || !nueva) throw new Error(error?.message ?? "No se pudo crear la institución");
  return nueva.id;
}

export async function createSection(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const institucionId = String(formData.get("institucion_id") ?? "").trim();
  const institucionNombre = String(formData.get("institucion_nombre") ?? "").trim();
  const direccionRegional = String(formData.get("direccion_regional") ?? "").trim();
  const circuito = String(formData.get("circuito") ?? "").trim();
  const provincia = String(formData.get("provincia") ?? "").trim();
  const canton = String(formData.get("canton") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const nivel = String(formData.get("nivel") ?? "").trim();
  const asignatura = String(formData.get("asignatura") ?? "").trim();
  const cicloEscolar = Number(formData.get("ciclo_escolar"));
  const notaMinima = Number(formData.get("nota_minima") ?? 70);
  const clonarDe = String(formData.get("clonar_de") ?? "").trim();

  if ((!institucionId && !institucionNombre) || !nombre || !nivel || !asignatura || !cicloEscolar) {
    return;
  }

  const institutionId = institucionId
    ? institucionId
    : await findOrCreateInstitution(
        supabase,
        institucionNombre,
        direccionRegional,
        circuito,
        provincia,
        canton,
      );

  const { data: section, error } = await supabase
    .from("sections")
    .insert({
      institution_id: institutionId,
      teacher_id: user.id,
      nombre,
      nivel,
      asignatura,
      ciclo_escolar: cicloEscolar,
      nota_minima: notaMinima,
    })
    .select("id")
    .single();

  if (error || !section) {
    throw new Error(error?.message ?? "No se pudo crear la sección");
  }

  await supabase.from("rubric_config").insert({ section_id: section.id });
  const { data: newPeriods } = await supabase
    .from("periods")
    .insert([
      { section_id: section.id, numero: 1, nombre: "Primer Periodo", porcentaje: 0.5 },
      { section_id: section.id, numero: 2, nombre: "Segundo Periodo", porcentaje: 0.5 },
    ])
    .select("id, numero");

  if (clonarDe) {
    await cloneStructure(supabase, user.id, clonarDe, section.id, newPeriods ?? []);
  }

  revalidatePath("/secciones");
  redirect(`/secciones/${section.id}/estudiantes`);
}

async function cloneStructure(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teacherId: string,
  sourceSectionId: string,
  targetSectionId: string,
  targetPeriods: { id: string; numero: number }[],
) {
  const { data: sourceSection } = await supabase
    .from("sections")
    .select("id")
    .eq("id", sourceSectionId)
    .eq("teacher_id", teacherId)
    .maybeSingle();
  if (!sourceSection) return;

  const { data: sourceRubric } = await supabase
    .from("rubric_config")
    .select("cotidiano_pct, tareas_pct, asistencia_pct, proyecto_pct, pruebas_pct, tolerancia_pct")
    .eq("section_id", sourceSectionId)
    .maybeSingle();
  if (sourceRubric) {
    await supabase.from("rubric_config").update(sourceRubric).eq("section_id", targetSectionId);
  }

  const { data: sourcePeriods } = await supabase
    .from("periods")
    .select("id, numero")
    .eq("section_id", sourceSectionId);

  const periodMap = new Map<string, string>();
  for (const sp of sourcePeriods ?? []) {
    const tp = targetPeriods.find((p) => p.numero === sp.numero);
    if (tp) periodMap.set(sp.id, tp.id);
  }
  const sourcePeriodIds = [...periodMap.keys()];
  if (sourcePeriodIds.length === 0) return;

  const { data: indicators } = await supabase
    .from("cotidiano_indicators")
    .select("period_id, numero, descripcion, puntos_max")
    .in("period_id", sourcePeriodIds);
  if (indicators?.length) {
    await supabase.from("cotidiano_indicators").insert(
      indicators.map((i) => ({
        section_id: targetSectionId,
        period_id: periodMap.get(i.period_id),
        numero: i.numero,
        descripcion: i.descripcion,
        puntos_max: i.puntos_max,
      })),
    );
  }

  const { data: exams } = await supabase
    .from("exams")
    .select("period_id, numero, nombre, puntos_max, porcentaje_relativo")
    .in("period_id", sourcePeriodIds);
  if (exams?.length) {
    await supabase.from("exams").insert(
      exams.map((e) => ({
        section_id: targetSectionId,
        period_id: periodMap.get(e.period_id),
        numero: e.numero,
        nombre: e.nombre,
        puntos_max: e.puntos_max,
        porcentaje_relativo: e.porcentaje_relativo,
      })),
    );
  }

  const { data: homeworkItems } = await supabase
    .from("homework_items")
    .select("period_id, numero, descripcion")
    .in("period_id", sourcePeriodIds);
  if (homeworkItems?.length) {
    await supabase.from("homework_items").insert(
      homeworkItems.map((h) => ({
        section_id: targetSectionId,
        period_id: periodMap.get(h.period_id),
        numero: h.numero,
        descripcion: h.descripcion,
      })),
    );
  }

  const { data: stages } = await supabase
    .from("project_stages")
    .select("period_id, nombre, puntos_max")
    .in("period_id", sourcePeriodIds);
  if (stages?.length) {
    await supabase.from("project_stages").insert(
      stages.map((e) => ({
        section_id: targetSectionId,
        period_id: periodMap.get(e.period_id),
        nombre: e.nombre,
        puntos_max: e.puntos_max,
      })),
    );
  }
}
