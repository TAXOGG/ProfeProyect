export type Profile = {
  id: string;
  institution_id: string | null;
  full_name: string | null;
  role: "admin" | "docente";
};

export type Section = {
  id: string;
  institution_id: string;
  teacher_id: string;
  nombre: string;
  nivel: string;
  asignatura: string;
  ciclo_escolar: number;
  nota_minima: number;
  cantidad_periodos: number;
  archivada: boolean;
};

export type RubricConfig = {
  section_id: string;
  cotidiano_pct: number;
  tareas_pct: number;
  asistencia_pct: number;
  proyecto_pct: number;
  pruebas_pct: number;
  tolerancia_pct: number;
  asistencia_nota: string | null;
  asistencia_advertencia_pct: number | null;
  asistencia_limite_pct: number | null;
};

export type SectionWithInstitution = Section & { institutionNombre: string };

export type Period = {
  id: string;
  section_id: string;
  numero: number;
  nombre: string;
  porcentaje: number;
};

export type CotidianoIndicator = {
  id: string;
  section_id: string;
  period_id: string;
  numero: number;
  descripcion: string;
  fecha_aplicacion: string | null;
  puntos_max: number;
};

export type CotidianoScore = {
  indicator_id: string;
  student_id: string;
  puntaje: number;
};

export type Exam = {
  id: string;
  section_id: string;
  period_id: string;
  numero: number;
  nombre: string;
  puntos_max: number;
  porcentaje_relativo: number;
};

export type ExamScore = {
  exam_id: string;
  student_id: string;
  puntos_obtenidos: number;
};

export type HomeworkItem = {
  id: string;
  section_id: string;
  period_id: string;
  numero: number;
  descripcion: string | null;
  fecha: string | null;
};

export type HomeworkScore = {
  homework_id: string;
  student_id: string;
  nota: number;
};

export type ProjectStage = {
  id: string;
  section_id: string;
  period_id: string;
  nombre: string;
  puntos_max: number;
};

export type ProjectScore = {
  stage_id: string;
  student_id: string;
  puntos_obtenidos: number;
};

export type AttendanceSession = {
  id: string;
  section_id: string;
  period_id: string;
  fecha: string;
  lecciones_impartidas: number;
};

export type AttendanceRecord = {
  session_id: string;
  student_id: string;
  ausencias: number;
  justificada: boolean;
  tardia: boolean;
};

export type Student = {
  id: string;
  section_id: string;
  numero: number;
  primer_apellido: string;
  segundo_apellido: string | null;
  nombre: string;
  identificacion: string | null;
  edad: number | null;
  sexo: string | null;
  tipo_apoyo: string | null;
  estado: "activo" | "trasladado" | "salido";
  correo_mep: string | null;
  correo_alternativo: string | null;
  telefono1: string | null;
  telefono2: string | null;
  contacto_nombre: string | null;
  contacto_parentesco: string | null;
  contacto_correo: string | null;
};

export type StudentPhoto = {
  id: string;
  student_id: string;
  section_id: string;
  categoria: string | null;
  nota: string | null;
  storage_path: string;
  created_at: string;
};
