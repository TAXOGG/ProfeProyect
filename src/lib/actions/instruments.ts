"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { InstrumentTipo } from "@/lib/types";

const TIPOS: InstrumentTipo[] = [
  "rubrica_analitica",
  "rubrica_holistica",
  "lista_cotejo",
  "escala_valoracion",
  "registro_anecdotico",
];

async function requireInstrumentEditable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  instrumentId: string,
) {
  const { data } = await supabase
    .from("instruments")
    .select("estado")
    .eq("id", instrumentId)
    .single();
  if (data?.estado === "aplicado") {
    throw new Error(
      "Este instrumento ya se aplicó al menos una vez. Duplicalo si necesitás cambiar su estructura, para no alterar resultados ya guardados.",
    );
  }
}

async function instrumentIdForCriterio(
  supabase: Awaited<ReturnType<typeof createClient>>,
  criterioId: string,
) {
  const { data } = await supabase
    .from("instrument_criteria")
    .select("instrument_id")
    .eq("id", criterioId)
    .single();
  return data?.instrument_id as string | undefined;
}

async function instrumentIdForNivel(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nivelId: string,
) {
  const { data } = await supabase
    .from("instrument_levels")
    .select("criterio_id, instrument_criteria ( instrument_id )")
    .eq("id", nivelId)
    .single();
  return (data?.instrument_criteria as unknown as { instrument_id: string } | null)
    ?.instrument_id;
}

export async function createInstrument(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nombre = String(formData.get("nombre") ?? "").trim();
  const tipoRaw = String(formData.get("tipo") ?? "");
  const materia = String(formData.get("materia") ?? "").trim();
  const nivel = String(formData.get("nivel") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();

  if (!nombre) throw new Error("Falta el nombre del instrumento.");
  if (!TIPOS.includes(tipoRaw as InstrumentTipo)) throw new Error("Elegí un tipo de instrumento.");
  const tipo = tipoRaw as InstrumentTipo;

  const { data: instrument, error } = await supabase
    .from("instruments")
    .insert({
      owner_id: user.id,
      nombre,
      descripcion: descripcion || null,
      tipo,
      materia: materia || null,
      nivel: nivel || null,
    })
    .select("id")
    .single();

  if (error || !instrument) throw new Error(error?.message ?? "No se pudo crear el instrumento.");

  // La rúbrica holística evalúa el desempeño general, no criterio por
  // criterio: se crea un único criterio implícito para que la estructura de
  // datos siga siendo la misma para los 5 tipos, sin exponer el concepto de
  // "criterio" en la interfaz de ese tipo.
  if (tipo === "rubrica_holistica") {
    await supabase.from("instrument_criteria").insert({
      instrument_id: instrument.id,
      orden: 1,
      descripcion: "Desempeño general",
    });
  }

  revalidatePath("/instrumentos");
  redirect(`/instrumentos/${instrument.id}`);
}

export async function updateInstrumentInfo(instrumentId: string, formData: FormData) {
  const supabase = await createClient();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const materia = String(formData.get("materia") ?? "").trim();
  const nivel = String(formData.get("nivel") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const instrucciones = String(formData.get("instrucciones") ?? "").trim();

  if (!nombre) throw new Error("Falta el nombre del instrumento.");

  const { error } = await supabase
    .from("instruments")
    .update({
      nombre,
      materia: materia || null,
      nivel: nivel || null,
      descripcion: descripcion || null,
      instrucciones: instrucciones || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", instrumentId);

  if (error) throw new Error(error.message);
  revalidatePath(`/instrumentos/${instrumentId}`);
  revalidatePath("/instrumentos");
}

export async function setInstrumentEstado(
  instrumentId: string,
  estado: "borrador" | "activo" | "archivado",
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("instruments")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", instrumentId);
  if (error) throw new Error(error.message);
  revalidatePath(`/instrumentos/${instrumentId}`);
  revalidatePath("/instrumentos");
}

export async function duplicateInstrument(instrumentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: original } = await supabase
    .from("instruments")
    .select("*")
    .eq("id", instrumentId)
    .single();
  if (!original) throw new Error("No se encontró el instrumento a duplicar.");

  const { data: copy, error } = await supabase
    .from("instruments")
    .insert({
      owner_id: user.id,
      nombre: `${original.nombre} (copia)`,
      descripcion: original.descripcion,
      tipo: original.tipo,
      materia: original.materia,
      nivel: original.nivel,
      instrucciones: original.instrucciones,
      estado: "borrador",
    })
    .select("id")
    .single();
  if (error || !copy) throw new Error(error?.message ?? "No se pudo duplicar el instrumento.");

  const { data: criteria } = await supabase
    .from("instrument_criteria")
    .select("id, orden, descripcion")
    .eq("instrument_id", instrumentId)
    .order("orden");

  for (const c of criteria ?? []) {
    const { data: newCriterio, error: criterioError } = await supabase
      .from("instrument_criteria")
      .insert({ instrument_id: copy.id, orden: c.orden, descripcion: c.descripcion })
      .select("id")
      .single();
    if (criterioError || !newCriterio) continue;

    const { data: levels } = await supabase
      .from("instrument_levels")
      .select("orden, nombre, descripcion, puntaje")
      .eq("criterio_id", c.id)
      .order("orden");

    if (levels && levels.length > 0) {
      await supabase.from("instrument_levels").insert(
        levels.map((l) => ({
          criterio_id: newCriterio.id,
          orden: l.orden,
          nombre: l.nombre,
          descripcion: l.descripcion,
          puntaje: l.puntaje,
        })),
      );
    }
  }

  revalidatePath("/instrumentos");
  redirect(`/instrumentos/${copy.id}`);
}

export async function addCriterio(instrumentId: string, formData: FormData) {
  const supabase = await createClient();
  await requireInstrumentEditable(supabase, instrumentId);

  const descripcion = String(formData.get("descripcion") ?? "").trim();
  if (!descripcion) throw new Error("Falta la descripción del criterio.");

  const { count } = await supabase
    .from("instrument_criteria")
    .select("id", { count: "exact", head: true })
    .eq("instrument_id", instrumentId);

  const { error } = await supabase
    .from("instrument_criteria")
    .insert({ instrument_id: instrumentId, orden: (count ?? 0) + 1, descripcion });
  if (error) throw new Error(error.message);
  revalidatePath(`/instrumentos/${instrumentId}`);
}

export async function updateCriterio(criterioId: string, formData: FormData) {
  const supabase = await createClient();
  const instrumentId = await instrumentIdForCriterio(supabase, criterioId);
  if (instrumentId) await requireInstrumentEditable(supabase, instrumentId);

  const descripcion = String(formData.get("descripcion") ?? "").trim();
  if (!descripcion) throw new Error("Falta la descripción del criterio.");

  const { error } = await supabase
    .from("instrument_criteria")
    .update({ descripcion })
    .eq("id", criterioId);
  if (error) throw new Error(error.message);
  if (instrumentId) revalidatePath(`/instrumentos/${instrumentId}`);
}

export async function deleteCriterio(criterioId: string) {
  const supabase = await createClient();
  const instrumentId = await instrumentIdForCriterio(supabase, criterioId);
  if (instrumentId) await requireInstrumentEditable(supabase, instrumentId);

  const { error } = await supabase.from("instrument_criteria").delete().eq("id", criterioId);
  if (error) throw new Error(error.message);
  if (instrumentId) revalidatePath(`/instrumentos/${instrumentId}`);
}

export async function addNivel(criterioId: string, formData: FormData) {
  const supabase = await createClient();
  const instrumentId = await instrumentIdForCriterio(supabase, criterioId);
  if (instrumentId) await requireInstrumentEditable(supabase, instrumentId);

  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const puntaje = Number(formData.get("puntaje"));
  if (!nombre) throw new Error("Falta el nombre del nivel.");
  if (!Number.isFinite(puntaje) || puntaje < 0) {
    throw new Error("El puntaje del nivel debe ser 0 o mayor.");
  }

  const { count } = await supabase
    .from("instrument_levels")
    .select("id", { count: "exact", head: true })
    .eq("criterio_id", criterioId);

  const { error } = await supabase.from("instrument_levels").insert({
    criterio_id: criterioId,
    orden: (count ?? 0) + 1,
    nombre,
    descripcion: descripcion || null,
    puntaje,
  });
  if (error) throw new Error(error.message);
  if (instrumentId) revalidatePath(`/instrumentos/${instrumentId}`);
}

export async function updateNivel(nivelId: string, formData: FormData) {
  const supabase = await createClient();
  const instrumentId = await instrumentIdForNivel(supabase, nivelId);
  if (instrumentId) await requireInstrumentEditable(supabase, instrumentId);

  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const puntaje = Number(formData.get("puntaje"));
  if (!nombre) throw new Error("Falta el nombre del nivel.");
  if (!Number.isFinite(puntaje) || puntaje < 0) {
    throw new Error("El puntaje del nivel debe ser 0 o mayor.");
  }

  const { error } = await supabase
    .from("instrument_levels")
    .update({ nombre, descripcion: descripcion || null, puntaje })
    .eq("id", nivelId);
  if (error) throw new Error(error.message);
  if (instrumentId) revalidatePath(`/instrumentos/${instrumentId}`);
}

export async function deleteNivel(nivelId: string) {
  const supabase = await createClient();
  const instrumentId = await instrumentIdForNivel(supabase, nivelId);
  if (instrumentId) await requireInstrumentEditable(supabase, instrumentId);

  const { error } = await supabase.from("instrument_levels").delete().eq("id", nivelId);
  if (error) throw new Error(error.message);
  if (instrumentId) revalidatePath(`/instrumentos/${instrumentId}`);
}
