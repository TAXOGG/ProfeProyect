import { createClient } from "@/lib/supabase/server";
import { computeSectionGrades, type StudentGrades } from "@/lib/grades";
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

async function fetchAllForPeriods<T>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  periodIds: string[],
): Promise<T[]> {
  if (periodIds.length === 0) return [];
  const { data } = await supabase.from(table).select("*").in("period_id", periodIds);
  return (data as T[]) ?? [];
}

async function fetchScoresFor<T>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  column: string,
  ids: string[],
): Promise<T[]> {
  if (ids.length === 0) return [];
  const { data } = await supabase.from(table).select("*").in(column, ids);
  return (data as T[]) ?? [];
}

export async function fetchSectionGradesData(
  sectionId: string,
  studentIdFilter?: string,
): Promise<{
  section: Section;
  periods: Period[];
  students: Student[];
  grades: StudentGrades[];
} | null> {
  const supabase = await createClient();

  const [{ data: section }, { data: periods }, { data: rubric }, studentsQuery] =
    await Promise.all([
      supabase.from("sections").select("*").eq("id", sectionId).single(),
      supabase.from("periods").select("*").eq("section_id", sectionId).order("numero"),
      supabase.from("rubric_config").select("*").eq("section_id", sectionId).single(),
      (() => {
        let q = supabase
          .from("students")
          .select("*")
          .eq("section_id", sectionId)
          .eq("estado", "activo")
          .order("numero");
        if (studentIdFilter) q = q.eq("id", studentIdFilter);
        return q;
      })(),
    ]);

  if (!section || !rubric) return null;

  const periodList = (periods as Period[]) ?? [];
  const periodIds = periodList.map((p) => p.id);

  const [cotidianoIndicators, exams, homeworkItems, projectStages, attendanceSessions] =
    await Promise.all([
      fetchAllForPeriods<CotidianoIndicator>(supabase, "cotidiano_indicators", periodIds),
      fetchAllForPeriods<Exam>(supabase, "exams", periodIds),
      fetchAllForPeriods<HomeworkItem>(supabase, "homework_items", periodIds),
      fetchAllForPeriods<ProjectStage>(supabase, "project_stages", periodIds),
      fetchAllForPeriods<AttendanceSession>(supabase, "attendance_sessions", periodIds),
    ]);

  const [cotidianoScores, examScores, homeworkScores, projectScores, attendanceRecords] =
    await Promise.all([
      fetchScoresFor<CotidianoScore>(
        supabase,
        "cotidiano_scores",
        "indicator_id",
        cotidianoIndicators.map((i) => i.id),
      ),
      fetchScoresFor<ExamScore>(supabase, "exam_scores", "exam_id", exams.map((e) => e.id)),
      fetchScoresFor<HomeworkScore>(
        supabase,
        "homework_scores",
        "homework_id",
        homeworkItems.map((h) => h.id),
      ),
      fetchScoresFor<ProjectScore>(
        supabase,
        "project_scores",
        "stage_id",
        projectStages.map((s) => s.id),
      ),
      fetchScoresFor<AttendanceRecord>(
        supabase,
        "attendance_records",
        "session_id",
        attendanceSessions.map((s) => s.id),
      ),
    ]);

  const studentList = (studentsQuery.data as Student[]) ?? [];

  const grades = computeSectionGrades({
    students: studentList,
    periods: periodList,
    rubric: rubric as RubricConfig,
    notaMinima: (section as Section).nota_minima,
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
  });

  return { section: section as Section, periods: periodList, students: studentList, grades };
}
