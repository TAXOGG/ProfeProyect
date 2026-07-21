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
  Student,
} from "@/lib/types";

export type PeriodGrades = {
  cotidiano: number;
  tareas: number;
  pruebas: number;
  proyecto: number;
  asistencia: number;
  notaFinal: number;
};

export type StudentGrades = {
  student: Student;
  periodos: Record<string, PeriodGrades>;
  notaAnual: number;
  condicion: "APROBADO" | "APLAZADO";
};

function notaPorPuntos(obtenidos: number, posibles: number) {
  return posibles > 0 ? (obtenidos * 100) / posibles : 0;
}

export function computeSectionGrades(input: {
  students: Student[];
  periods: Period[];
  rubric: RubricConfig;
  notaMinima: number;
  cotidianoIndicators: CotidianoIndicator[];
  cotidianoScores: CotidianoScore[];
  exams: Exam[];
  examScores: ExamScore[];
  homeworkItems: HomeworkItem[];
  homeworkScores: HomeworkScore[];
  projectStages: ProjectStage[];
  projectScores: ProjectScore[];
  attendanceSessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
}): StudentGrades[] {
  const {
    students,
    periods,
    rubric,
    notaMinima,
    cotidianoIndicators,
    cotidianoScores,
    exams,
    examScores,
    homeworkItems,
    homeworkScores,
    projectStages,
    projectScores,
    attendanceSessions,
    attendanceRecords,
  } = input;

  return students.map((student) => {
    const periodos: Record<string, PeriodGrades> = {};

    for (const period of periods) {
      const indicators = cotidianoIndicators.filter((i) => i.period_id === period.id);
      const posiblesCotidiano = indicators.reduce((sum, i) => sum + i.puntos_max, 0);
      const obtenidosCotidiano = indicators.reduce((sum, i) => {
        const score = cotidianoScores.find(
          (s) => s.indicator_id === i.id && s.student_id === student.id,
        );
        return sum + (score?.puntaje ?? 0);
      }, 0);
      const cotidiano = notaPorPuntos(obtenidosCotidiano, posiblesCotidiano);

      const items = homeworkItems.filter((h) => h.period_id === period.id);
      const tareas =
        items.length > 0
          ? items.reduce((sum, h) => {
              const score = homeworkScores.find(
                (s) => s.homework_id === h.id && s.student_id === student.id,
              );
              return sum + (score?.nota ?? 0);
            }, 0) / items.length
          : 0;

      const periodExams = exams.filter((e) => e.period_id === period.id);
      const pruebas = periodExams.reduce((sum, e) => {
        const score = examScores.find(
          (s) => s.exam_id === e.id && s.student_id === student.id,
        );
        const nota = notaPorPuntos(score?.puntos_obtenidos ?? 0, e.puntos_max);
        return sum + nota * e.porcentaje_relativo;
      }, 0);

      const stages = projectStages.filter((e) => e.period_id === period.id);
      const posiblesProyecto = stages.reduce((sum, e) => sum + e.puntos_max, 0);
      const obtenidosProyecto = stages.reduce((sum, e) => {
        const score = projectScores.find(
          (s) => s.stage_id === e.id && s.student_id === student.id,
        );
        return sum + (score?.puntos_obtenidos ?? 0);
      }, 0);
      const proyecto = notaPorPuntos(obtenidosProyecto, posiblesProyecto);

      const sessions = attendanceSessions.filter((s) => s.period_id === period.id);
      const totalLecciones = sessions.reduce((sum, s) => sum + s.lecciones_impartidas, 0);
      const ausenciasEfectivas = sessions.reduce((sum, session) => {
        const record = attendanceRecords.find(
          (r) => r.session_id === session.id && r.student_id === student.id,
        );
        if (!record || record.justificada) return sum;
        return sum + record.ausencias;
      }, 0);
      const pctAsistencia =
        totalLecciones > 0 ? Math.max(0, 1 - ausenciasEfectivas / totalLecciones) : 1;
      const asistencia = pctAsistencia * 100;

      const notaFinal =
        cotidiano * rubric.cotidiano_pct +
        tareas * rubric.tareas_pct +
        pruebas * rubric.pruebas_pct +
        proyecto * rubric.proyecto_pct +
        asistencia * rubric.asistencia_pct;

      periodos[period.id] = { cotidiano, tareas, pruebas, proyecto, asistencia, notaFinal };
    }

    const notaAnual = periods.reduce(
      (sum, p) => sum + (periodos[p.id]?.notaFinal ?? 0) * p.porcentaje,
      0,
    );

    return {
      student,
      periodos,
      notaAnual,
      condicion: notaAnual >= notaMinima ? "APROBADO" : "APLAZADO",
    };
  });
}
