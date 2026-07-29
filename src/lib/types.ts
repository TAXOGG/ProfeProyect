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
  asistencia_metodo: "lineal" | "mep";
};

export type SectionWithInstitution = Section & { institutionNombre: string };

export type InstrumentTipo =
  | "rubrica_analitica"
  | "rubrica_holistica"
  | "lista_cotejo"
  | "escala_valoracion"
  | "registro_anecdotico";

export type InstrumentEstado = "borrador" | "activo" | "aplicado" | "archivado";

export type Instrument = {
  id: string;
  owner_id: string;
  nombre: string;
  descripcion: string | null;
  tipo: InstrumentTipo;
  materia: string | null;
  nivel: string | null;
  instrucciones: string | null;
  estado: InstrumentEstado;
  created_at: string;
  updated_at: string;
};

export type InstrumentCriterio = {
  id: string;
  instrument_id: string;
  orden: number;
  descripcion: string;
};

export type InstrumentNivel = {
  id: string;
  criterio_id: string;
  orden: number;
  nombre: string;
  descripcion: string | null;
  puntaje: number;
};

export type InstrumentRubroDestino = "cotidiano" | "pruebas" | "tareas" | "proyecto";
export type InstrumentTargetKind = "cotidiano_indicator" | "exam" | "homework_item" | "project_stage";

export type InstrumentApplication = {
  id: string;
  instrument_id: string;
  section_id: string;
  period_id: string;
  rubro_destino: InstrumentRubroDestino | null;
  target_kind: InstrumentTargetKind | null;
  target_id: string | null;
  fecha: string;
  estado: "pendiente" | "completada";
  created_by: string | null;
  created_at: string;
};

export type InstrumentResult = {
  id: string;
  application_id: string;
  student_id: string;
  criterio_scores: Record<string, string>;
  puntaje_obtenido: number | null;
  observacion: string | null;
  estado: "borrador" | "completado";
  created_at: string;
  updated_at: string;
};

export type Period = {
  id: string;
  section_id: string;
  numero: number;
  nombre: string;
  porcentaje: number;
  estado: "borrador" | "activo" | "cerrado" | "reabierto";
  cerrado_at: string | null;
  cerrado_por: string | null;
  razon_reapertura: string | null;
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
  deleted_at: string | null;
};

export type EvidenceFileType = "imagen" | "pdf";

export type StudentPhoto = {
  id: string;
  student_id: string;
  section_id: string;
  categoria: string | null;
  nota: string | null;
  storage_path: string;
  support_record_id: string | null;
  file_type: EvidenceFileType;
  file_name: string | null;
  instrument_result_id: string | null;
  deleted_at: string | null;
  created_at: string;
};

export type SupportRecord = {
  id: string;
  student_id: string;
  section_id: string;
  period_id: string | null;
  fecha: string;
  tipo_apoyo: string;
  descripcion: string;
  motivo: string | null;
  contexto: string | null;
  resultado_observado: string | null;
  seguimiento_requerido: boolean;
  proximo_seguimiento: string | null;
  responsable: string | null;
  estado: "activo" | "archivado";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ObservationTemplate = {
  id: string;
  owner_id: string;
  categoria: string | null;
  materia: string | null;
  nivel: string | null;
  texto: string;
  favorito: boolean;
  created_at: string;
  updated_at: string;
};

// Misma forma que ObservationTemplate a propósito: comparten el mismo
// componente de selección (ObservationPicker) en el formulario de
// comunicaciones.
export type CommunicationTemplate = ObservationTemplate;

export type SupportRecordFollowup = {
  id: string;
  support_record_id: string;
  fecha: string;
  nota: string;
  created_by: string | null;
  created_at: string;
};

export type ComunicacionTipo =
  | "progreso"
  | "ausencia"
  | "trabajo_pendiente"
  | "convocatoria"
  | "reconocimiento"
  | "seguimiento"
  | "personalizada";

export type ComunicacionMedio = "correo" | "llamada" | "reunion" | "mensajeria" | "impresa" | "otro";

export type ComunicacionEstado = "preparada" | "enviada" | "registrada_manualmente";

export type Communication = {
  id: string;
  student_id: string;
  section_id: string;
  period_id: string | null;
  tipo: ComunicacionTipo;
  medio: ComunicacionMedio;
  destinatario: string | null;
  mensaje: string;
  adjunta_informe: boolean;
  estado: ComunicacionEstado;
  fecha_realizada: string | null;
  observacion: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
