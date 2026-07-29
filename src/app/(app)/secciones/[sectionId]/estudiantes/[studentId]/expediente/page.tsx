import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchSectionGradesData } from "@/lib/section-grades-data";
import { TIPO_LABEL } from "@/lib/instrument-labels";
import { TABLE_LABEL, summarizeAuditEntry, type AuditEntry } from "@/lib/audit";
import { PhotoGallery } from "@/components/photo-gallery";
import type {
  InstrumentResult,
  InstrumentTipo,
  Section,
  Student,
  StudentPhoto,
  SupportRecord,
  SupportRecordFollowup,
} from "@/lib/types";

const BUCKET = "student-photos";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function studentName(s: Student) {
  return `${s.primer_apellido} ${s.segundo_apellido ?? ""} ${s.nombre}`.replace(/\s+/g, " ").trim();
}

export default async function ExpedientePage({
  params,
}: {
  params: Promise<{ sectionId: string; studentId: string }>;
}) {
  const { sectionId, studentId } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase.from("students").select("*").eq("id", studentId).single();
  if (!student) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-sm text-zinc-500">
        No se encontró el estudiante.
      </div>
    );
  }
  const s = student as Student;

  const [
    gradesData,
    { data: applications },
    { data: instrumentResults },
    { data: supportRecords },
    { data: photos },
    { data: auditEntries },
  ] = await Promise.all([
    fetchSectionGradesData(sectionId, studentId),
    supabase
      .from("instrument_applications")
      .select("id, fecha, rubro_destino, instruments ( nombre, tipo )")
      .eq("section_id", sectionId),
    supabase.from("instrument_results").select("*").eq("student_id", studentId),
    supabase
      .from("support_records")
      .select("*")
      .eq("student_id", studentId)
      .order("fecha", { ascending: false }),
    supabase
      .from("student_photos")
      .select("*")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("audit_log")
      .select("*")
      .eq("student_id", studentId)
      .order("changed_at", { ascending: false })
      .limit(50),
  ]);

  const supportRecordIds = (supportRecords ?? []).map((r) => r.id as string);
  const { data: followups } =
    supportRecordIds.length > 0
      ? await supabase
          .from("support_record_followups")
          .select("*")
          .in("support_record_id", supportRecordIds)
          .order("created_at", { ascending: false })
      : { data: [] as SupportRecordFollowup[] };
  const tipoApoyoByRecordId = new Map(
    (supportRecords ?? []).map((r) => [r.id as string, r.tipo_apoyo as string]),
  );

  const section = gradesData?.section as Section | undefined;
  const periods = gradesData?.periods ?? [];
  const grade = gradesData?.grades?.[0];

  const applicationById = new Map(
    (applications ?? []).map((a) => [
      a.id,
      {
        fecha: a.fecha as string,
        rubroDestino: a.rubro_destino as string | null,
        instrumento: a.instruments as unknown as { nombre: string; tipo: string } | null,
      },
    ]),
  );
  const resultsForStudent = (instrumentResults as InstrumentResult[]) ?? [];

  const supportList = (supportRecords as SupportRecord[]) ?? [];
  const apoyosActivos = supportList.filter((r) => r.estado === "activo").length;

  const followupList = (followups as SupportRecordFollowup[]) ?? [];

  const evaluacionesPendientes = resultsForStudent.filter((r) => r.estado !== "completado").length;

  // Observaciones consolidadas: junta lo que ya se escribió en otros
  // módulos (no se guarda de nuevo en ningún lado) — comentarios de
  // instrumentos aplicados + notas de seguimiento de apoyos.
  const observaciones = [
    ...resultsForStudent
      .filter((r) => r.observacion)
      .map((r) => {
        const app = applicationById.get(r.application_id);
        return {
          fecha: app?.fecha ?? r.updated_at,
          fuente: app?.instrumento ? `Instrumento: ${app.instrumento.nombre}` : "Instrumento",
          texto: r.observacion as string,
        };
      }),
    ...followupList.map((f) => ({
      fecha: f.created_at,
      fuente: `Apoyo: ${tipoApoyoByRecordId.get(f.support_record_id) ?? ""}`,
      texto: f.nota,
    })),
  ].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  const photoList = (photos as StudentPhoto[]) ?? [];
  const paths = photoList.map((p) => p.storage_path);
  let signedUrlByPath: Record<string, string> = {};
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
    signedUrlByPath = Object.fromEntries(
      (signed ?? []).filter((sg) => sg.signedUrl).map((sg) => [sg.path, sg.signedUrl as string]),
    );
  }

  const entries = (auditEntries as AuditEntry[]) ?? [];
  const ultimaActualizacion = entries[0]?.changed_at ?? null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
      <Link
        href={`/secciones/${sectionId}/estudiantes`}
        className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
      >
        ← Volver a Estudiantes
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">{studentName(s)}</h1>
      <p className="mt-1 text-sm text-zinc-500">Expediente pedagógico</p>

      {/* Resumen */}
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Resumen</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-zinc-400">Grupo</p>
            <p className="text-zinc-800">{section ? `${section.asignatura} — ${section.nombre}` : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Nivel · Ciclo</p>
            <p className="text-zinc-800">
              {section ? `${section.nivel} · ${section.ciclo_escolar}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Promedio anual</p>
            <p className="text-zinc-800">{grade ? grade.notaAnual.toFixed(1) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Condición</p>
            <p className={grade?.condicion === "APROBADO" ? "text-emerald-600" : "text-red-600"}>
              {grade?.condicion ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Apoyos activos</p>
            <p className="text-zinc-800">{apoyosActivos}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Evaluaciones pendientes</p>
            <p className="text-zinc-800">{evaluacionesPendientes}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          Última actualización:{" "}
          {ultimaActualizacion ? new Date(ultimaActualizacion).toLocaleString("es-CR") : "—"}
        </p>
        {s.estado !== "activo" && (
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
            Este estudiante está marcado como &ldquo;{s.estado}&rdquo; — las calificaciones y
            asistencia de esta vista solo se calculan para estudiantes activos.
          </p>
        )}
      </div>

      {/* Calificaciones y asistencia */}
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Calificaciones y asistencia</h2>
        {grade ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-2 py-1 text-left">Periodo</th>
                  <th className="px-2 py-1 text-center">Cotidiano</th>
                  <th className="px-2 py-1 text-center">Tareas</th>
                  <th className="px-2 py-1 text-center">Pruebas</th>
                  <th className="px-2 py-1 text-center">Proyecto</th>
                  <th className="px-2 py-1 text-center">Asistencia</th>
                  <th className="px-2 py-1 text-center">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {periods.map((p) => {
                  const pg = grade.periodos[p.id];
                  return (
                    <tr key={p.id}>
                      <td className="px-2 py-1.5 font-medium text-zinc-800">{p.nombre}</td>
                      <td className="px-2 py-1.5 text-center text-zinc-600">{pg?.cotidiano.toFixed(0) ?? "—"}</td>
                      <td className="px-2 py-1.5 text-center text-zinc-600">{pg?.tareas.toFixed(0) ?? "—"}</td>
                      <td className="px-2 py-1.5 text-center text-zinc-600">{pg?.pruebas.toFixed(0) ?? "—"}</td>
                      <td className="px-2 py-1.5 text-center text-zinc-600">{pg?.proyecto.toFixed(0) ?? "—"}</td>
                      <td className="px-2 py-1.5 text-center text-zinc-600">{pg?.asistencia.toFixed(0) ?? "—"}</td>
                      <td className="px-2 py-1.5 text-center font-semibold text-zinc-900">
                        {pg?.notaFinal.toFixed(1) ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-xs text-zinc-400">
            No hay calificaciones calculadas (el estudiante puede estar inactivo o la sección no
            tiene periodos configurados).
          </p>
        )}
      </div>

      {/* Instrumentos aplicados */}
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Instrumentos aplicados</h2>
        <div className="mt-2 flex flex-col gap-2">
          {resultsForStudent.map((r) => {
            const app = applicationById.get(r.application_id);
            return (
              <div key={r.id} className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-zinc-800">{app?.instrumento?.nombre ?? "—"}</p>
                  <p className="text-xs text-zinc-400">
                    {app?.instrumento ? TIPO_LABEL[app.instrumento.tipo as InstrumentTipo] : ""}
                    {app?.fecha ? ` · ${app.fecha}` : ""}
                  </p>
                </div>
                <span className="text-xs text-zinc-500">
                  {r.puntaje_obtenido !== null ? `${r.puntaje_obtenido} pts` : ""}{" "}
                  {r.estado === "completado" ? "✓" : "borrador"}
                </span>
              </div>
            );
          })}
          {resultsForStudent.length === 0 && (
            <p className="text-xs text-zinc-400">No se aplicó ningún instrumento todavía.</p>
          )}
        </div>
      </div>

      {/* Apoyos */}
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Registros de apoyo</h2>
          <Link
            href={`/secciones/${sectionId}/apoyos/nuevo`}
            className="text-xs font-medium text-teal-700 hover:underline"
          >
            + Nuevo
          </Link>
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {supportList.map((r) => (
            <Link
              key={r.id}
              href={`/secciones/${sectionId}/apoyos/${r.id}`}
              className="block rounded-md bg-zinc-50 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              <p className="font-medium text-zinc-800">
                {r.tipo_apoyo} {r.estado === "archivado" ? "(archivado)" : ""}
              </p>
              <p className="truncate text-xs text-zinc-500">{r.descripcion}</p>
              <p className="text-xs text-zinc-400">{r.fecha}</p>
            </Link>
          ))}
          {supportList.length === 0 && (
            <p className="text-xs text-zinc-400">Todavía no hay apoyos registrados.</p>
          )}
        </div>
      </div>

      {/* Observaciones consolidadas */}
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Observaciones</h2>
        <div className="mt-2 flex flex-col gap-2">
          {observaciones.map((o, i) => (
            <div key={i} className="rounded-md bg-zinc-50 px-3 py-2 text-sm">
              <p className="text-zinc-700">{o.texto}</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {o.fuente} · {new Date(o.fecha).toLocaleDateString("es-CR")}
              </p>
            </div>
          ))}
          {observaciones.length === 0 && (
            <p className="text-xs text-zinc-400">
              No hay observaciones registradas todavía (aparecen acá las que se escriben al
              aplicar un instrumento o al darle seguimiento a un apoyo).
            </p>
          )}
        </div>
      </div>

      {/* Evidencias */}
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Evidencias</h2>
          <Link
            href={`/secciones/${sectionId}/estudiantes/${studentId}/fotos`}
            className="text-xs font-medium text-teal-700 hover:underline"
          >
            Ver / agregar evidencia
          </Link>
        </div>
        <div className="mt-2">
          <PhotoGallery
            sectionId={sectionId}
            studentId={studentId}
            photos={photoList
              .slice(0, 8)
              .map((p) => ({ ...p, url: signedUrlByPath[p.storage_path] ?? null }))}
          />
        </div>
      </div>

      {/* Informes y comunicaciones — todavía no existen como módulos */}
      <div className="mt-6 rounded-lg border border-dashed border-zinc-300 p-5 text-center text-sm text-zinc-400">
        Informes y Comunicaciones todavía no están disponibles como módulos — quedan pendientes de
        una próxima fase.
      </div>

      {/* Historial */}
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Historial</h2>
        <div className="mt-2 flex flex-col gap-1.5">
          {entries.map((e) => (
            <div key={e.id} className="text-xs text-zinc-500">
              <span className="text-zinc-400">{new Date(e.changed_at).toLocaleString("es-CR")}</span>{" "}
              · {TABLE_LABEL[e.table_name] ?? e.table_name} — {summarizeAuditEntry(e)}
            </div>
          ))}
          {entries.length === 0 && (
            <p className="text-xs text-zinc-400">Todavía no hay cambios registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
}
