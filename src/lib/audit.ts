export type AuditEntry = {
  id: string;
  section_id: string | null;
  student_id: string | null;
  table_name: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string | null;
  changed_at: string;
};

export const TABLE_LABEL: Record<string, string> = {
  students: "Estudiante",
  rubric_config: "Rubros",
  periods: "Periodo",
  cotidiano_scores: "Cotidiano",
  exam_scores: "Pruebas",
  homework_scores: "Tareas",
  project_scores: "Proyecto",
  attendance_records: "Asistencia",
};

// Campos que no aportan nada útil en el resumen (ids técnicos, llaves
// foráneas que ya se muestran aparte).
const IGNORED_FIELDS = new Set([
  "id",
  "section_id",
  "student_id",
  "indicator_id",
  "exam_id",
  "homework_id",
  "stage_id",
  "session_id",
  "numero",
  "created_at",
]);

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  return String(v);
}

export function summarizeAuditEntry(entry: AuditEntry): string {
  if (entry.table_name === "students") {
    const before = entry.old_data;
    const after = entry.new_data;
    const wasDeleted = !!before?.deleted_at;
    const isDeleted = !!after?.deleted_at;
    if (entry.action === "DELETE" && !after) return "Eliminado permanentemente";
    if (!wasDeleted && isDeleted) return "Enviado a la papelera";
    if (wasDeleted && !isDeleted) return "Restaurado desde la papelera";
    if (entry.action === "INSERT") return "Estudiante agregado";
  }

  const before = entry.old_data ?? {};
  const after = entry.new_data ?? {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes: string[] = [];
  for (const key of keys) {
    if (IGNORED_FIELDS.has(key)) continue;
    const oldVal = before[key];
    const newVal = after[key];
    if (JSON.stringify(oldVal) === JSON.stringify(newVal)) continue;
    if (entry.action === "INSERT") {
      changes.push(`${key}: ${formatValue(newVal)}`);
    } else if (entry.action === "DELETE") {
      changes.push(`${key}: ${formatValue(oldVal)}`);
    } else {
      changes.push(`${key}: ${formatValue(oldVal)} → ${formatValue(newVal)}`);
    }
  }

  if (changes.length === 0) {
    return entry.action === "INSERT" ? "Creado" : entry.action === "DELETE" ? "Eliminado" : "Sin cambios visibles";
  }
  return changes.join(" · ");
}
