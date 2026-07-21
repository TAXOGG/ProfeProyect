"use client";

import { createClient } from "@/lib/supabase/client";
import { db } from "@/lib/offline/db";
import { ACTION_REGISTRY, type ActionName } from "@/lib/offline/action-registry";
import type {
  AttendanceRecord,
  AttendanceSession,
  CotidianoIndicator,
  CotidianoScore,
  Exam,
  ExamScore,
  HomeworkItem,
  HomeworkScore,
  Period,
  ProjectScore,
  ProjectStage,
  RubricConfig,
  Section,
  Student,
} from "@/lib/types";

/** Sección, periodos, rubros y estudiantes activos — la base que necesita cualquier módulo. */
async function pullSectionBase(sectionId: string) {
  const supabase = createClient();
  const [{ data: section }, { data: rubric }, { data: periods }, { data: students }] =
    await Promise.all([
      supabase.from("sections").select("*").eq("id", sectionId).single(),
      supabase.from("rubric_config").select("*").eq("section_id", sectionId).single(),
      supabase.from("periods").select("*").eq("section_id", sectionId).order("numero"),
      supabase
        .from("students")
        .select("*")
        .eq("section_id", sectionId)
        .eq("estado", "activo")
        .order("numero"),
    ]);

  const periodList = (periods as Period[]) ?? [];

  await db.transaction("rw", [db.sections, db.rubricConfigs, db.periods, db.students], async () => {
    if (section) await db.sections.put(section as Section);
    if (rubric) await db.rubricConfigs.put(rubric as RubricConfig);
    await db.periods.bulkPut(periodList);
    await db.students.bulkPut((students as Student[]) ?? []);
  });

  return { periodIds: periodList.map((p) => p.id) };
}

/**
 * Descarga a IndexedDB todo lo que hace falta para trabajar Trabajo Cotidiano
 * sin conexión: la sección, sus periodos, la distribución de rubros, los
 * estudiantes activos, los indicadores de todos los periodos y sus notas.
 * Se llama con conexión (al entrar a la sección, y cada vez que vuelve la red).
 */
export async function pullCotidianoData(sectionId: string): Promise<void> {
  const supabase = createClient();
  const { periodIds } = await pullSectionBase(sectionId);

  const { data: indicators } = periodIds.length
    ? await supabase.from("cotidiano_indicators").select("*").in("period_id", periodIds)
    : { data: [] as CotidianoIndicator[] };
  const indicatorIds = (indicators ?? []).map((i) => i.id);

  const { data: scores } = indicatorIds.length
    ? await supabase.from("cotidiano_scores").select("*").in("indicator_id", indicatorIds)
    : { data: [] as CotidianoScore[] };

  await db.transaction("rw", [db.cotidianoIndicators, db.cotidianoScores], async () => {
    await db.cotidianoIndicators.bulkPut((indicators as CotidianoIndicator[]) ?? []);
    await db.cotidianoScores.bulkPut((scores as CotidianoScore[]) ?? []);
  });
}

/** Mismo patrón que Cotidiano, para Pruebas: exámenes de todos los periodos y sus notas. */
export async function pullPruebasData(sectionId: string): Promise<void> {
  const supabase = createClient();
  const { periodIds } = await pullSectionBase(sectionId);

  const { data: exams } = periodIds.length
    ? await supabase.from("exams").select("*").in("period_id", periodIds)
    : { data: [] as Exam[] };
  const examIds = (exams ?? []).map((e) => e.id);

  const { data: scores } = examIds.length
    ? await supabase.from("exam_scores").select("*").in("exam_id", examIds)
    : { data: [] as ExamScore[] };

  await db.transaction("rw", [db.exams, db.examScores], async () => {
    await db.exams.bulkPut((exams as Exam[]) ?? []);
    await db.examScores.bulkPut((scores as ExamScore[]) ?? []);
  });
}

/** Mismo patrón, para Tareas: ítems de todos los periodos y sus notas. */
export async function pullTareasData(sectionId: string): Promise<void> {
  const supabase = createClient();
  const { periodIds } = await pullSectionBase(sectionId);

  const { data: items } = periodIds.length
    ? await supabase.from("homework_items").select("*").in("period_id", periodIds)
    : { data: [] as HomeworkItem[] };
  const itemIds = (items ?? []).map((h) => h.id);

  const { data: scores } = itemIds.length
    ? await supabase.from("homework_scores").select("*").in("homework_id", itemIds)
    : { data: [] as HomeworkScore[] };

  await db.transaction("rw", [db.homeworkItems, db.homeworkScores], async () => {
    await db.homeworkItems.bulkPut((items as HomeworkItem[]) ?? []);
    await db.homeworkScores.bulkPut((scores as HomeworkScore[]) ?? []);
  });
}

/** Mismo patrón, para Proyecto: etapas de todos los periodos y sus notas. */
export async function pullProyectoData(sectionId: string): Promise<void> {
  const supabase = createClient();
  const { periodIds } = await pullSectionBase(sectionId);

  const { data: stages } = periodIds.length
    ? await supabase.from("project_stages").select("*").in("period_id", periodIds)
    : { data: [] as ProjectStage[] };
  const stageIds = (stages ?? []).map((s) => s.id);

  const { data: scores } = stageIds.length
    ? await supabase.from("project_scores").select("*").in("stage_id", stageIds)
    : { data: [] as ProjectScore[] };

  await db.transaction("rw", [db.projectStages, db.projectScores], async () => {
    await db.projectStages.bulkPut((stages as ProjectStage[]) ?? []);
    await db.projectScores.bulkPut((scores as ProjectScore[]) ?? []);
  });
}

/** Mismo patrón, para Asistencia: fechas de clase de todos los periodos y sus registros. */
export async function pullAsistenciaData(sectionId: string): Promise<void> {
  const supabase = createClient();
  const { periodIds } = await pullSectionBase(sectionId);

  const { data: sessions } = periodIds.length
    ? await supabase.from("attendance_sessions").select("*").in("period_id", periodIds)
    : { data: [] as AttendanceSession[] };
  const sessionIds = (sessions ?? []).map((s) => s.id);

  const { data: records } = sessionIds.length
    ? await supabase.from("attendance_records").select("*").in("session_id", sessionIds)
    : { data: [] as AttendanceRecord[] };

  await db.transaction("rw", [db.attendanceSessions, db.attendanceRecords], async () => {
    await db.attendanceSessions.bulkPut((sessions as AttendanceSession[]) ?? []);
    await db.attendanceRecords.bulkPut((records as AttendanceRecord[]) ?? []);
  });
}

/** Encola una acción para ejecutarla contra el servidor apenas vuelva la conexión. */
export async function enqueueAction(actionName: ActionName, args: unknown[], sectionId: string) {
  await db.syncQueue.add({ actionName, args, sectionId, createdAt: Date.now() });
}

export type FlushResult = { synced: number; failed: number };

/**
 * Sube en orden las acciones pendientes. Se detiene en el primer error de un
 * ítem (probablemente la red se volvió a caer) y lo deja en la cola para el
 * próximo intento — nunca descarta un cambio del docente por un fallo de red.
 */
export async function flushQueue(): Promise<FlushResult> {
  let synced = 0;
  let failed = 0;

  const items = await db.syncQueue.orderBy("createdAt").toArray();
  for (const item of items) {
    const action = ACTION_REGISTRY[item.actionName as ActionName];
    if (!action) {
      // Acción desconocida (versión vieja de la app) — se descarta para no
      // trabar la cola indefinidamente.
      await db.syncQueue.delete(item.id!);
      continue;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (action as (...a: any[]) => Promise<unknown>)(...item.args);
      await db.syncQueue.delete(item.id!);
      synced++;
    } catch (err) {
      failed++;
      await db.syncQueue.update(item.id!, {
        lastError: err instanceof Error ? err.message : "Error desconocido",
      });
      break;
    }
  }

  return { synced, failed };
}

export async function pendingCount(sectionId?: string): Promise<number> {
  if (sectionId) return db.syncQueue.where("sectionId").equals(sectionId).count();
  return db.syncQueue.count();
}
