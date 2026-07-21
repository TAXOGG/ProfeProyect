"use client";

import { upsertPuntaje } from "@/lib/actions/cotidiano";
import { upsertExamScore } from "@/lib/actions/exams";
import { upsertHomeworkScore } from "@/lib/actions/homework";
import { upsertStageScore } from "@/lib/actions/project";
import { upsertRecord } from "@/lib/actions/attendance";

/**
 * Server Actions que se pueden ejecutar más tarde desde la cola de
 * sincronización. Solo entran acá las mutaciones de alta frecuencia que un
 * docente hace en vivo durante la clase (poner una nota, marcar una
 * ausencia) — crear/editar indicadores, pruebas, fechas, etc. se asume que
 * se hace con conexión, antes o después de la clase, así que no necesitan
 * pasar por la cola.
 */
export const ACTION_REGISTRY = {
  "cotidiano.upsertPuntaje": upsertPuntaje,
  "pruebas.upsertExamScore": upsertExamScore,
  "tareas.upsertHomeworkScore": upsertHomeworkScore,
  "proyecto.upsertStageScore": upsertStageScore,
  "asistencia.upsertRecord": upsertRecord,
} as const;

export type ActionName = keyof typeof ACTION_REGISTRY;
