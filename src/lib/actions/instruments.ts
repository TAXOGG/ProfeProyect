"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { InstrumentRubroDestino, InstrumentTargetKind, InstrumentTipo } from "@/lib/types";

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

async function computeInstrumentTotal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  instrumentId: string,
) {
  const { data: criteria } = await supabase
    .from("instrument_criteria")
    .select("id")
    .eq("instrument_id", instrumentId);
  const criterioIds = (criteria ?? []).map((c) => c.id as string);
  if (criterioIds.length === 0) return 0;

  const { data: levels } = await supabase
    .from("instrument_levels")
    .select("criterio_id, puntaje")
    .in("criterio_id", criterioIds);

  let total = 0;
  for (const cId of criterioIds) {
    const max = Math.max(
      0,
      ...(levels ?? []).filter((l) => l.criterio_id === cId).map((l) => l.puntaje as number),
    );
    total += max;
  }
  return total;
}

// Aplica el instrumento a una sección/periodo: crea el ítem destino (nueva
// Prueba/Tarea/Etapa/Indicador, nombrado igual que el instrumento) en la
// misma escala que el instrumento, para que el puntaje obtenido se pueda
// escribir directo sin reescalar (salvo Tareas, que siempre son 0-100).
export async function applyInstrument(instrumentId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sectionId = String(formData.get("section_id") ?? "").trim();
  const periodId = String(formData.get("period_id") ?? "").trim();
  const rubroDestino = String(formData.get("rubro_destino") ?? "").trim() as
    | InstrumentRubroDestino
    | "";
  const fecha = String(formData.get("fecha") ?? "").trim() || new Date().toISOString().slice(0, 10);

  if (!sectionId || !periodId) throw new Error("Elegí una sección y un periodo.");

  const { data: instrument } = await supabase
    .from("instruments")
    .select("id, nombre, tipo, estado")
    .eq("id", instrumentId)
    .single();
  if (!instrument) throw new Error("No se encontró el instrumento.");

  const generaNota = instrument.tipo !== "registro_anecdotico";
  if (generaNota && !rubroDestino) throw new Error("Elegí a qué rubro va a ir la nota.");

  let targetKind: InstrumentTargetKind | null = null;
  let targetId: string | null = null;

  if (generaNota) {
    const total = await computeInstrumentTotal(supabase, instrumentId);
    if (total <= 0) {
      throw new Error(
        "El instrumento no tiene niveles con puntaje todavía — agregá al menos uno antes de aplicarlo.",
      );
    }

    if (rubroDestino === "cotidiano") {
      const { count } = await supabase
        .from("cotidiano_indicators")
        .select("id", { count: "exact", head: true })
        .eq("period_id", periodId);
      const { data: item, error } = await supabase
        .from("cotidiano_indicators")
        .insert({
          section_id: sectionId,
          period_id: periodId,
          numero: (count ?? 0) + 1,
          descripcion: instrument.nombre,
          puntos_max: total,
        })
        .select("id")
        .single();
      if (error || !item) throw new Error(error?.message ?? "No se pudo crear el indicador.");
      targetKind = "cotidiano_indicator";
      targetId = item.id;
    } else if (rubroDestino === "pruebas") {
      const { count } = await supabase
        .from("exams")
        .select("id", { count: "exact", head: true })
        .eq("period_id", periodId);
      const { data: item, error } = await supabase
        .from("exams")
        .insert({
          section_id: sectionId,
          period_id: periodId,
          numero: (count ?? 0) + 1,
          nombre: instrument.nombre,
          puntos_max: total,
          // 0 por defecto: si ya hay otras pruebas en el periodo, un peso de
          // 1 aquí sumaría más de 100% y falsearía la nota del rubro. El
          // profesor debe asignar el peso real desde Pruebas.
          porcentaje_relativo: 0,
        })
        .select("id")
        .single();
      if (error || !item) throw new Error(error?.message ?? "No se pudo crear la prueba.");
      targetKind = "exam";
      targetId = item.id;
    } else if (rubroDestino === "tareas") {
      const { count } = await supabase
        .from("homework_items")
        .select("id", { count: "exact", head: true })
        .eq("period_id", periodId);
      const { data: item, error } = await supabase
        .from("homework_items")
        .insert({
          section_id: sectionId,
          period_id: periodId,
          numero: (count ?? 0) + 1,
          descripcion: instrument.nombre,
        })
        .select("id")
        .single();
      if (error || !item) throw new Error(error?.message ?? "No se pudo crear la tarea.");
      targetKind = "homework_item";
      targetId = item.id;
    } else if (rubroDestino === "proyecto") {
      const { data: item, error } = await supabase
        .from("project_stages")
        .insert({
          section_id: sectionId,
          period_id: periodId,
          nombre: instrument.nombre,
          puntos_max: total,
        })
        .select("id")
        .single();
      if (error || !item) throw new Error(error?.message ?? "No se pudo crear la etapa.");
      targetKind = "project_stage";
      targetId = item.id;
    } else {
      throw new Error("Rubro destino inválido.");
    }
  }

  const { data: application, error: appError } = await supabase
    .from("instrument_applications")
    .insert({
      instrument_id: instrumentId,
      section_id: sectionId,
      period_id: periodId,
      rubro_destino: generaNota ? rubroDestino : null,
      target_kind: targetKind,
      target_id: targetId,
      fecha,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (appError || !application) {
    throw new Error(appError?.message ?? "No se pudo crear la aplicación.");
  }

  if (instrument.estado !== "archivado") {
    await supabase.from("instruments").update({ estado: "aplicado" }).eq("id", instrumentId);
  }

  revalidatePath(`/secciones/${sectionId}/instrumentos`);
  redirect(`/secciones/${sectionId}/instrumentos/${application.id}`);
}

export type SaveInstrumentResultInput = {
  criterioScores: Record<string, string>;
  observacion: string;
  finalize: boolean;
};

// Guarda el resultado de un estudiante y, si se finaliza, escribe la nota
// calculada en la tabla de siempre (exam_scores, homework_scores, etc.),
// dejando la referencia de vuelta al instrumento vía instrument_results.
export async function saveInstrumentResult(
  applicationId: string,
  studentId: string,
  input: SaveInstrumentResultInput,
) {
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("instrument_applications")
    .select("*, instruments ( id, tipo )")
    .eq("id", applicationId)
    .single();
  if (!application) throw new Error("No se encontró la aplicación.");

  const instrumentTipo = (application.instruments as unknown as { tipo: string } | null)?.tipo;
  const generaNota = instrumentTipo !== "registro_anecdotico";

  let puntajeObtenido: number | null = null;
  if (generaNota) {
    const nivelIds = Object.values(input.criterioScores);
    if (nivelIds.length > 0) {
      const { data: levels } = await supabase
        .from("instrument_levels")
        .select("id, puntaje")
        .in("id", nivelIds);
      puntajeObtenido = (levels ?? []).reduce((sum, l) => sum + (l.puntaje as number), 0);
    } else {
      puntajeObtenido = 0;
    }
  }

  const { data: resultRow, error } = await supabase
    .from("instrument_results")
    .upsert(
      {
        application_id: applicationId,
        student_id: studentId,
        criterio_scores: input.criterioScores,
        puntaje_obtenido: puntajeObtenido,
        observacion: input.observacion || null,
        estado: input.finalize ? "completado" : "borrador",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "application_id,student_id" },
    )
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (input.finalize && generaNota && application.target_kind && application.target_id) {
    const targetId = application.target_id as string;
    const puntos = puntajeObtenido ?? 0;

    if (application.target_kind === "cotidiano_indicator") {
      const { error: writeError } = await supabase
        .from("cotidiano_scores")
        .upsert(
          { indicator_id: targetId, student_id: studentId, puntaje: puntos },
          { onConflict: "indicator_id,student_id" },
        );
      if (writeError) throw new Error(writeError.message);
    } else if (application.target_kind === "exam") {
      const { error: writeError } = await supabase
        .from("exam_scores")
        .upsert(
          { exam_id: targetId, student_id: studentId, puntos_obtenidos: puntos },
          { onConflict: "exam_id,student_id" },
        );
      if (writeError) throw new Error(writeError.message);
    } else if (application.target_kind === "project_stage") {
      const { error: writeError } = await supabase
        .from("project_scores")
        .upsert(
          { stage_id: targetId, student_id: studentId, puntos_obtenidos: puntos },
          { onConflict: "stage_id,student_id" },
        );
      if (writeError) throw new Error(writeError.message);
    } else if (application.target_kind === "homework_item") {
      // homework_scores.nota es siempre 0-100, hay que reescalar contra el
      // puntaje total del instrumento.
      const total = await computeInstrumentTotal(supabase, application.instrument_id as string);
      const nota = total > 0 ? Math.min(100, (puntos / total) * 100) : 0;
      const { error: writeError } = await supabase
        .from("homework_scores")
        .upsert(
          { homework_id: targetId, student_id: studentId, nota },
          { onConflict: "homework_id,student_id" },
        );
      if (writeError) throw new Error(writeError.message);
    }
  }

  revalidatePath(`/secciones/${application.section_id}/instrumentos/${applicationId}`);
  if (application.rubro_destino) {
    revalidatePath(`/secciones/${application.section_id}/${application.rubro_destino}`);
  }

  return { id: resultRow.id as string };
}
