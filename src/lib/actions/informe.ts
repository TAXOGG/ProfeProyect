"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchSectionGradesData } from "@/lib/section-grades-data";
import { TIPO_LABEL } from "@/lib/instrument-labels";
import {
  renderInformeIntegralPdf,
  type InformeApoyoRow,
  type InformeInstrumentoRow,
  type InformeObservacionRow,
} from "@/lib/pdf/informe-integral";
import { sendEmail, LOGO_URL } from "@/lib/email";
import type { InstrumentResult, InstrumentTipo, Period, Section, Student } from "@/lib/types";
import type { StudentGrades } from "@/lib/grades";

const OBSERVACIONES_LIMIT = 15;
const APOYOS_LIMIT = 20;

export async function buildInformeIntegralData(sectionId: string, studentId: string) {
  const gradesData = await fetchSectionGradesData(sectionId, studentId);
  if (!gradesData) return null;
  const studentGrades = gradesData.grades[0];
  if (!studentGrades) return null;

  const supabase = await createClient();

  const [{ data: applications }, { data: instrumentResults }, { data: supportRecords }] =
    await Promise.all([
      supabase
        .from("instrument_applications")
        .select("id, fecha, instruments ( nombre, tipo )")
        .eq("section_id", sectionId),
      supabase
        .from("instrument_results")
        .select("*")
        .eq("student_id", studentId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("support_records")
        .select("*")
        .eq("student_id", studentId)
        .order("fecha", { ascending: false })
        .limit(APOYOS_LIMIT),
    ]);

  const applicationById = new Map(
    (applications ?? []).map((a) => [
      a.id,
      {
        fecha: a.fecha as string,
        instrumento: a.instruments as unknown as { nombre: string; tipo: string } | null,
      },
    ]),
  );
  const resultsForStudent = (instrumentResults as InstrumentResult[]) ?? [];

  const supportList = supportRecords ?? [];
  const supportRecordIds = supportList.map((r) => r.id as string);
  const { data: followups } =
    supportRecordIds.length > 0
      ? await supabase
          .from("support_record_followups")
          .select("*")
          .in("support_record_id", supportRecordIds)
          .order("created_at", { ascending: false })
      : { data: [] as { support_record_id: string; created_at: string; nota: string }[] };
  const tipoApoyoByRecordId = new Map(supportList.map((r) => [r.id as string, r.tipo_apoyo as string]));

  const instrumentos: InformeInstrumentoRow[] = resultsForStudent
    .filter((r) => r.estado === "completado")
    .map((r) => {
      const app = applicationById.get(r.application_id);
      return {
        fecha: app?.fecha ?? "",
        nombre: app?.instrumento?.nombre ?? "—",
        tipoLabel: app?.instrumento ? TIPO_LABEL[app.instrumento.tipo as InstrumentTipo] : "—",
        puntaje: r.puntaje_obtenido !== null ? `${r.puntaje_obtenido} pts` : "—",
      };
    });

  const apoyos: InformeApoyoRow[] = supportList.map((r) => ({
    fecha: r.fecha as string,
    tipoApoyo: r.tipo_apoyo as string,
    descripcion: r.descripcion as string,
    estado: r.estado as string,
  }));

  const observaciones: InformeObservacionRow[] = [
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
    ...(followups ?? []).map((f) => ({
      fecha: f.created_at,
      fuente: `Apoyo: ${tipoApoyoByRecordId.get(f.support_record_id) ?? ""}`,
      texto: f.nota,
    })),
  ]
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
    .slice(0, OBSERVACIONES_LIMIT);

  return {
    section: gradesData.section as Section,
    student: studentGrades.student as Student,
    periods: gradesData.periods as Period[],
    grades: studentGrades as StudentGrades,
    apoyos,
    instrumentos,
    observaciones,
  };
}

export type InformeIntegralData = NonNullable<Awaited<ReturnType<typeof buildInformeIntegralData>>>;

// Versión por lotes de buildInformeIntegralData: en vez de volver a pedir los
// datos de toda la sección (periodos, pruebas, cotidiano, etc.) una vez por
// cada estudiante, los trae una sola vez y arma el informe de cada uno a
// partir de ese mismo resultado — evita el N+1 de generar 30 informes.
export async function buildInformeIntegralBatch(
  sectionId: string,
  studentIds: string[],
): Promise<Map<string, InformeIntegralData>> {
  const result = new Map<string, InformeIntegralData>();
  if (studentIds.length === 0) return result;

  const gradesData = await fetchSectionGradesData(sectionId);
  if (!gradesData) return result;

  const supabase = await createClient();

  const [{ data: applications }, { data: instrumentResults }, { data: supportRecords }] =
    await Promise.all([
      supabase
        .from("instrument_applications")
        .select("id, fecha, instruments ( nombre, tipo )")
        .eq("section_id", sectionId),
      supabase
        .from("instrument_results")
        .select("*")
        .in("student_id", studentIds)
        .order("updated_at", { ascending: false }),
      supabase
        .from("support_records")
        .select("*")
        .in("student_id", studentIds)
        .order("fecha", { ascending: false }),
    ]);

  const applicationById = new Map(
    (applications ?? []).map((a) => [
      a.id,
      {
        fecha: a.fecha as string,
        instrumento: a.instruments as unknown as { nombre: string; tipo: string } | null,
      },
    ]),
  );

  const resultsByStudent = new Map<string, InstrumentResult[]>();
  for (const r of (instrumentResults as InstrumentResult[]) ?? []) {
    const list = resultsByStudent.get(r.student_id) ?? [];
    list.push(r);
    resultsByStudent.set(r.student_id, list);
  }

  const supportByStudent = new Map<string, typeof supportRecords>();
  for (const r of supportRecords ?? []) {
    const list = supportByStudent.get(r.student_id as string) ?? [];
    if (list.length < APOYOS_LIMIT) list.push(r);
    supportByStudent.set(r.student_id as string, list);
  }

  const supportRecordIds = (supportRecords ?? []).map((r) => r.id as string);
  const { data: followups } =
    supportRecordIds.length > 0
      ? await supabase
          .from("support_record_followups")
          .select("*")
          .in("support_record_id", supportRecordIds)
          .order("created_at", { ascending: false })
      : { data: [] as { support_record_id: string; created_at: string; nota: string }[] };
  const tipoApoyoByRecordId = new Map(
    (supportRecords ?? []).map((r) => [r.id as string, r.tipo_apoyo as string]),
  );
  const followupsByRecord = new Map<string, { created_at: string; nota: string }[]>();
  for (const f of followups ?? []) {
    const list = followupsByRecord.get(f.support_record_id) ?? [];
    list.push(f);
    followupsByRecord.set(f.support_record_id, list);
  }

  for (const studentId of studentIds) {
    const studentGrades = gradesData.grades.find((g) => g.student.id === studentId);
    if (!studentGrades) continue;

    const resultsForStudent = resultsByStudent.get(studentId) ?? [];
    const supportList = supportByStudent.get(studentId) ?? [];

    const instrumentos: InformeInstrumentoRow[] = resultsForStudent
      .filter((r) => r.estado === "completado")
      .map((r) => {
        const app = applicationById.get(r.application_id);
        return {
          fecha: app?.fecha ?? "",
          nombre: app?.instrumento?.nombre ?? "—",
          tipoLabel: app?.instrumento ? TIPO_LABEL[app.instrumento.tipo as InstrumentTipo] : "—",
          puntaje: r.puntaje_obtenido !== null ? `${r.puntaje_obtenido} pts` : "—",
        };
      });

    const apoyos: InformeApoyoRow[] = supportList.map((r) => ({
      fecha: r.fecha as string,
      tipoApoyo: r.tipo_apoyo as string,
      descripcion: r.descripcion as string,
      estado: r.estado as string,
    }));

    const supportIdsForStudent = new Set(supportList.map((r) => r.id as string));
    const observaciones: InformeObservacionRow[] = [
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
      ...[...supportIdsForStudent].flatMap((recordId) =>
        (followupsByRecord.get(recordId) ?? []).map((f) => ({
          fecha: f.created_at,
          fuente: `Apoyo: ${tipoApoyoByRecordId.get(recordId) ?? ""}`,
          texto: f.nota,
        })),
      ),
    ]
      .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
      .slice(0, OBSERVACIONES_LIMIT);

    result.set(studentId, {
      section: gradesData.section as Section,
      student: studentGrades.student as Student,
      periods: gradesData.periods as Period[],
      grades: studentGrades as StudentGrades,
      apoyos,
      instrumentos,
      observaciones,
    });
  }

  return result;
}

export type SendInformeResult = { success?: boolean; error?: string };

function informeEmailHtml(input: {
  studentFullName: string;
  sectionLabel: string;
  introText?: string;
}) {
  const { studentFullName, sectionLabel, introText } = input;
  return `
<div style="font-family: Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #3f3f46;">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="padding-right: 8px; vertical-align: middle;">
      <img src="${LOGO_URL}" width="28" height="28" alt="ARCE" style="display: block;" />
    </td>
    <td style="vertical-align: middle;">
      <span style="font-size: 18px; font-weight: bold; color: #0f766e;">ARCE</span>
    </td>
  </tr></table>
  <div style="border-bottom: 3px solid #0f766e; margin: 8px 0 16px;"></div>
  <p style="font-size: 14px; line-height: 1.5;">Estimado padre, madre o representante,</p>
  ${
    introText
      ? `<div style="background:#f0fdfa; border-left:3px solid #0f766e; border-radius:4px; padding:10px 12px; margin: 12px 0;">
           <p style="font-size:13px; line-height:1.4; margin:0;">${introText}</p>
         </div>`
      : ""
  }
  <p style="font-size: 14px; line-height: 1.5;">
    Adjunto encontrará el informe integral de <strong>${studentFullName}</strong>
    correspondiente a <strong>${sectionLabel}</strong>, con calificaciones, apoyos educativos y
    observaciones registradas por el docente.
  </p>
  <p style="font-size: 12px; color: #71717a; margin-top: 24px;">
    Este correo fue enviado por ARCE (Agilización de Registros para la Calificación del
    Educador) a solicitud del docente a cargo.
  </p>
</div>`.trim();
}

export async function sendInformeIntegral(
  sectionId: string,
  studentId: string,
  introText?: string,
): Promise<SendInformeResult> {
  const data = await buildInformeIntegralData(sectionId, studentId);
  if (!data) return { error: "No se encontró al estudiante." };

  const { student, section } = data;
  if (!student.contacto_correo) {
    return { error: "Este estudiante no tiene un correo de contacto registrado." };
  }

  const studentFullName = `${student.primer_apellido} ${student.segundo_apellido ?? ""} ${student.nombre}`
    .replace(/\s+/g, " ")
    .trim();
  const sectionLabel = `${section.asignatura} — ${section.nombre}`;

  try {
    const pdfBuffer = await renderInformeIntegralPdf({ ...data, introText });

    await sendEmail({
      to: student.contacto_correo,
      subject: `Informe integral — ${studentFullName}`,
      html: informeEmailHtml({ studentFullName, sectionLabel, introText }),
      attachments: [
        {
          filename: `informe-${studentFullName.replace(/\s+/g, "-").toLowerCase()}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo enviar el informe." };
  }
}
