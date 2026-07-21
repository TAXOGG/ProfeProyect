"use client";

import Dexie, { type Table } from "dexie";
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

export type SyncQueueItem = {
  id?: number;
  actionName: string;
  args: unknown[];
  sectionId: string;
  createdAt: number;
  lastError?: string;
};

/**
 * Base de datos local (IndexedDB) que espeja las tablas de Supabase necesarias
 * para trabajar sin conexión. Solo cubre las secciones activas del docente y
 * los módulos convertidos a modo local-first (ver ACTION_REGISTRY).
 */
class HojaVivaDB extends Dexie {
  sections!: Table<Section, string>;
  rubricConfigs!: Table<RubricConfig, string>;
  periods!: Table<Period, string>;
  students!: Table<Student, string>;

  cotidianoIndicators!: Table<CotidianoIndicator, string>;
  cotidianoScores!: Table<CotidianoScore, [string, string]>;

  exams!: Table<Exam, string>;
  examScores!: Table<ExamScore, [string, string]>;

  homeworkItems!: Table<HomeworkItem, string>;
  homeworkScores!: Table<HomeworkScore, [string, string]>;

  projectStages!: Table<ProjectStage, string>;
  projectScores!: Table<ProjectScore, [string, string]>;

  attendanceSessions!: Table<AttendanceSession, string>;
  attendanceRecords!: Table<AttendanceRecord, [string, string]>;

  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super("hojaviva-offline");
    this.version(1).stores({
      sections: "id, teacher_id, archivada",
      rubricConfigs: "section_id",
      periods: "id, section_id",
      students: "id, section_id, estado",

      cotidianoIndicators: "id, section_id, period_id",
      cotidianoScores: "[indicator_id+student_id], indicator_id, student_id",

      exams: "id, section_id, period_id",
      examScores: "[exam_id+student_id], exam_id, student_id",

      homeworkItems: "id, section_id, period_id",
      homeworkScores: "[homework_id+student_id], homework_id, student_id",

      projectStages: "id, section_id, period_id",
      projectScores: "[stage_id+student_id], stage_id, student_id",

      attendanceSessions: "id, section_id, period_id",
      attendanceRecords: "[session_id+student_id], session_id, student_id",

      syncQueue: "++id, sectionId, createdAt",
    });
  }
}

export const db = new HojaVivaDB();
