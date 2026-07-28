"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createSupportRecord(sectionId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const studentIds = formData.getAll("student_id").map(String).filter(Boolean);
  const tipoApoyo = String(formData.get("tipo_apoyo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const motivo = String(formData.get("motivo") ?? "").trim();
  const contexto = String(formData.get("contexto") ?? "").trim();
  const responsable = String(formData.get("responsable") ?? "").trim();
  const periodId = String(formData.get("period_id") ?? "").trim();
  const fecha = String(formData.get("fecha") ?? "").trim() || new Date().toISOString().slice(0, 10);
  const seguimientoRequerido = formData.get("seguimiento_requerido") === "on";
  const proximoSeguimiento = String(formData.get("proximo_seguimiento") ?? "").trim();

  if (studentIds.length === 0) throw new Error("Elegí al menos un estudiante.");
  if (!tipoApoyo) throw new Error("Falta el tipo de apoyo.");
  if (!descripcion) throw new Error("Falta la descripción del apoyo.");

  const { error } = await supabase.from("support_records").insert(
    studentIds.map((studentId) => ({
      student_id: studentId,
      section_id: sectionId,
      period_id: periodId || null,
      fecha,
      tipo_apoyo: tipoApoyo,
      descripcion,
      motivo: motivo || null,
      contexto: contexto || null,
      seguimiento_requerido: seguimientoRequerido,
      proximo_seguimiento: proximoSeguimiento || null,
      responsable: responsable || null,
      created_by: user.id,
    })),
  );
  if (error) throw new Error(error.message);

  revalidatePath(`/secciones/${sectionId}/apoyos`);
  redirect(`/secciones/${sectionId}/apoyos`);
}

export async function updateSupportRecord(sectionId: string, recordId: string, formData: FormData) {
  const supabase = await createClient();

  const tipoApoyo = String(formData.get("tipo_apoyo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const motivo = String(formData.get("motivo") ?? "").trim();
  const contexto = String(formData.get("contexto") ?? "").trim();
  const resultadoObservado = String(formData.get("resultado_observado") ?? "").trim();
  const responsable = String(formData.get("responsable") ?? "").trim();
  const seguimientoRequerido = formData.get("seguimiento_requerido") === "on";
  const proximoSeguimiento = String(formData.get("proximo_seguimiento") ?? "").trim();

  if (!tipoApoyo) throw new Error("Falta el tipo de apoyo.");
  if (!descripcion) throw new Error("Falta la descripción del apoyo.");

  const { error } = await supabase
    .from("support_records")
    .update({
      tipo_apoyo: tipoApoyo,
      descripcion,
      motivo: motivo || null,
      contexto: contexto || null,
      resultado_observado: resultadoObservado || null,
      responsable: responsable || null,
      seguimiento_requerido: seguimientoRequerido,
      proximo_seguimiento: proximoSeguimiento || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recordId);
  if (error) throw new Error(error.message);

  revalidatePath(`/secciones/${sectionId}/apoyos`);
  revalidatePath(`/secciones/${sectionId}/apoyos/${recordId}`);
}

export async function duplicateSupportRecord(sectionId: string, recordId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: original } = await supabase
    .from("support_records")
    .select("*")
    .eq("id", recordId)
    .single();
  if (!original) throw new Error("No se encontró el registro a duplicar.");

  const { data: copy, error } = await supabase
    .from("support_records")
    .insert({
      student_id: original.student_id,
      section_id: original.section_id,
      period_id: original.period_id,
      fecha: new Date().toISOString().slice(0, 10),
      tipo_apoyo: original.tipo_apoyo,
      descripcion: original.descripcion,
      motivo: original.motivo,
      contexto: original.contexto,
      seguimiento_requerido: original.seguimiento_requerido,
      proximo_seguimiento: null,
      responsable: original.responsable,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !copy) throw new Error(error?.message ?? "No se pudo duplicar el registro.");

  revalidatePath(`/secciones/${sectionId}/apoyos`);
  redirect(`/secciones/${sectionId}/apoyos/${copy.id}`);
}

export async function setSupportRecordEstado(
  sectionId: string,
  recordId: string,
  estado: "activo" | "archivado",
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("support_records")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", recordId);
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/apoyos`);
  revalidatePath(`/secciones/${sectionId}/apoyos/${recordId}`);
}

export async function addFollowup(sectionId: string, recordId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nota = String(formData.get("nota") ?? "").trim();
  if (!nota) throw new Error("Falta la nota del seguimiento.");

  const { error } = await supabase.from("support_record_followups").insert({
    support_record_id: recordId,
    nota,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/secciones/${sectionId}/apoyos/${recordId}`);
}
