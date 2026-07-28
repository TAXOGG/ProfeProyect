import { createClient } from "@/lib/supabase/server";
import { moduleColor } from "@/lib/module-colors";
import { TABLE_LABEL, summarizeAuditEntry, type AuditEntry } from "@/lib/audit";
import type { Student } from "@/lib/types";

const ACTION_LABEL: Record<string, string> = {
  INSERT: "Creación",
  UPDATE: "Cambio",
  DELETE: "Eliminación",
};

export default async function HistorialPage({
  params,
  searchParams,
}: {
  params: Promise<{ sectionId: string }>;
  searchParams: Promise<{ tabla?: string; accion?: string }>;
}) {
  const { sectionId } = await params;
  const { tabla, accion } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("audit_log")
    .select("*")
    .eq("section_id", sectionId)
    .order("changed_at", { ascending: false })
    .limit(300);
  if (tabla) query = query.eq("table_name", tabla);
  if (accion) query = query.eq("action", accion);

  const [{ data: entries }, { data: students }] = await Promise.all([
    query,
    supabase.from("students").select("id, primer_apellido, segundo_apellido, nombre").eq("section_id", sectionId),
  ]);

  const list = (entries as AuditEntry[]) ?? [];
  const studentNameById = new Map(
    ((students as Pick<Student, "id" | "primer_apellido" | "segundo_apellido" | "nombre">[]) ?? []).map(
      (s) => [s.id, `${s.primer_apellido} ${s.segundo_apellido ?? ""} ${s.nombre}`.replace(/\s+/g, " ").trim()],
    ),
  );

  const changedByIds = [...new Set(list.map((e) => e.changed_by).filter((v): v is string => !!v))];
  const { data: profiles } =
    changedByIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", changedByIds)
      : { data: [] as { id: string; full_name: string | null }[] };
  const nameByUserId = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const color = moduleColor("historial");
  const tablasPresentes = [...new Set(list.map((e) => e.table_name))];

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`rounded-lg border px-4 py-3 sm:px-5 sm:py-4 ${color.headerBg} ${color.headerBorder}`}
      >
        <h2 className="text-lg font-semibold text-zinc-900">Historial de cambios</h2>
        <p className="text-sm text-zinc-600">
          Quién cambió qué y cuándo, en esta sección. Muestra los últimos 300 movimientos.
        </p>
      </div>

      <form className="flex flex-wrap gap-2">
        <select
          name="tabla"
          defaultValue={tabla ?? ""}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">Todos los módulos</option>
          {Object.entries(TABLE_LABEL)
            .filter(([key]) => tablasPresentes.includes(key) || key === tabla)
            .map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
        </select>
        <select
          name="accion"
          defaultValue={accion ?? ""}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">Todas las acciones</option>
          <option value="INSERT">Creación</option>
          <option value="UPDATE">Cambio</option>
          <option value="DELETE">Eliminación</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Módulo</th>
              <th className="px-4 py-2">Acción</th>
              <th className="px-4 py-2">Estudiante</th>
              <th className="px-4 py-2">Qué cambió</th>
              <th className="px-4 py-2">Quién</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {list.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-500">
                  {new Date(e.changed_at).toLocaleString("es-CR")}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-700">
                  {TABLE_LABEL[e.table_name] ?? e.table_name}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-500">
                  {ACTION_LABEL[e.action] ?? e.action}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-700">
                  {e.student_id ? (studentNameById.get(e.student_id) ?? "—") : "—"}
                </td>
                <td className="px-4 py-2 text-zinc-600">{summarizeAuditEntry(e)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-500">
                  {e.changed_by ? (nameByUserId.get(e.changed_by) ?? "Docente") : "—"}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-400">
                  Todavía no hay cambios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
