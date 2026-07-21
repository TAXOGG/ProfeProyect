"use server";

import { fetchSectionGradesData } from "@/lib/section-grades-data";
import { renderRubroDetallePdf, type RubroDetallePeriod } from "@/lib/pdf/rubro-detalle";
import { sendEmail, LOGO_URL } from "@/lib/email";

export type SendRubroReportResult = { success?: boolean; error?: string };

const MODULE_META = {
  cotidiano: { label: "Trabajo Cotidiano", accent: "#0d9488", accentLight: "#f0fdfa" },
  pruebas: { label: "Pruebas", accent: "#6FA83D", accentLight: "#f2f7ec" },
  tareas: { label: "Tareas", accent: "#0ea5e9", accentLight: "#f0f9ff" },
  proyecto: { label: "Proyecto", accent: "#8b5cf6", accentLight: "#f5f3ff" },
  asistencia: { label: "Asistencia", accent: "#f97316", accentLight: "#fff7ed" },
} as const;

export type RubroModulo = keyof typeof MODULE_META;

function reporteEmailHtml(input: {
  studentFullName: string;
  sectionLabel: string;
  moduleLabel: string;
  noteText?: string;
}) {
  const { studentFullName, sectionLabel, moduleLabel, noteText } = input;
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
  <p style="font-size: 14px; line-height: 1.5;">
    Adjunto encontrará el reporte de <strong>${moduleLabel}</strong> de
    <strong>${studentFullName}</strong> correspondiente a <strong>${sectionLabel}</strong>.
  </p>
  ${
    noteText
      ? `<div style="background:#fff7ed; border:1px solid #f97316; border-radius:4px; padding:10px 12px; margin: 12px 0;">
           <p style="font-size:11px; font-weight:bold; text-transform:uppercase; color:#c2410c; margin:0 0 4px;">Nota importante</p>
           <p style="font-size:13px; line-height:1.4; margin:0;">${noteText}</p>
         </div>`
      : ""
  }
  <p style="font-size: 14px; line-height: 1.5;">
    Este documento se generó automáticamente a partir del registro que lleva el docente y es de
    carácter informativo.
  </p>
  <p style="font-size: 12px; color: #71717a; margin-top: 24px;">
    Este correo fue enviado por ARCE (Agilización de Registros para la Calificación del
    Educador) a solicitud del docente a cargo.
  </p>
</div>`.trim();
}

export async function sendRubroReporte(
  sectionId: string,
  studentId: string,
  modulo: RubroModulo,
): Promise<SendRubroReportResult> {
  const meta = MODULE_META[modulo];
  if (!meta) return { error: "Módulo inválido." };

  const data = await fetchSectionGradesData(sectionId, studentId);
  if (!data) return { error: "No se encontró la sección." };

  const {
    section,
    periods,
    grades,
    rubric,
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
  } = data;

  const studentGrades = grades[0];
  if (!studentGrades) return { error: "No se encontró al estudiante." };

  const { student } = studentGrades;
  if (!student.contacto_correo) {
    return { error: "Este estudiante no tiene un correo de contacto registrado." };
  }

  const studentFullName =
    `${student.primer_apellido} ${student.segundo_apellido ?? ""} ${student.nombre}`
      .replace(/\s+/g, " ")
      .trim();
  const sectionLabel = `${section.asignatura} — ${section.nombre}`;
  const noteText = modulo === "asistencia" ? (rubric.asistencia_nota ?? undefined) : undefined;

  try {
    const periodRows: RubroDetallePeriod[] = periods.map((p) => {
      const g = studentGrades.periodos[p.id];

      if (modulo === "cotidiano") {
        const indicators = cotidianoIndicators
          .filter((i) => i.period_id === p.id)
          .sort((a, b) => a.numero - b.numero);
        return {
          id: p.id,
          nombre: p.nombre,
          rows: indicators.map((i) => {
            const score = cotidianoScores.find(
              (s) => s.indicator_id === i.id && s.student_id === student.id,
            );
            return {
              item: `#${i.numero} ${i.descripcion}`,
              detalle: `máx ${i.puntos_max} pts${i.fecha_aplicacion ? " · " + i.fecha_aplicacion : ""}`,
              valor: `${score?.puntaje ?? 0}/${i.puntos_max}`,
            };
          }),
          summaryLabel: "Nota Cotidiano",
          summaryValue: g.cotidiano.toFixed(1),
          aporteValue: (g.cotidiano * rubric.cotidiano_pct).toFixed(1),
        };
      }

      if (modulo === "pruebas") {
        const periodExams = exams
          .filter((e) => e.period_id === p.id)
          .sort((a, b) => a.numero - b.numero);
        return {
          id: p.id,
          nombre: p.nombre,
          rows: periodExams.map((e) => {
            const score = examScores.find(
              (s) => s.exam_id === e.id && s.student_id === student.id,
            );
            return {
              item: e.nombre,
              detalle: `máx ${e.puntos_max} pts · ${(e.porcentaje_relativo * 100).toFixed(0)}%`,
              valor: `${score?.puntos_obtenidos ?? 0}/${e.puntos_max}`,
            };
          }),
          summaryLabel: "Nota Pruebas",
          summaryValue: g.pruebas.toFixed(1),
          aporteValue: (g.pruebas * rubric.pruebas_pct).toFixed(1),
        };
      }

      if (modulo === "tareas") {
        const items = homeworkItems
          .filter((h) => h.period_id === p.id)
          .sort((a, b) => a.numero - b.numero);
        return {
          id: p.id,
          nombre: p.nombre,
          rows: items.map((h) => {
            const score = homeworkScores.find(
              (s) => s.homework_id === h.id && s.student_id === student.id,
            );
            return {
              item: `#${h.numero}${h.descripcion ? " " + h.descripcion : ""}`,
              detalle: h.fecha ?? "",
              valor: `${score?.nota ?? 0}`,
            };
          }),
          summaryLabel: "Nota Tareas",
          summaryValue: g.tareas.toFixed(1),
          aporteValue: (g.tareas * rubric.tareas_pct).toFixed(1),
        };
      }

      if (modulo === "proyecto") {
        const stages = projectStages.filter((st) => st.period_id === p.id);
        return {
          id: p.id,
          nombre: p.nombre,
          rows: stages.map((st) => {
            const score = projectScores.find(
              (s) => s.stage_id === st.id && s.student_id === student.id,
            );
            return {
              item: st.nombre,
              detalle: `máx ${st.puntos_max} pts`,
              valor: `${score?.puntos_obtenidos ?? 0}/${st.puntos_max}`,
            };
          }),
          summaryLabel: "Nota Proyecto",
          summaryValue: g.proyecto.toFixed(1),
          aporteValue: (g.proyecto * rubric.proyecto_pct).toFixed(1),
        };
      }

      // asistencia
      const sessions = attendanceSessions
        .filter((s) => s.period_id === p.id)
        .sort((a, b) => a.fecha.localeCompare(b.fecha));
      return {
        id: p.id,
        nombre: p.nombre,
        rows: sessions.map((session) => {
          const record = attendanceRecords.find(
            (r) => r.session_id === session.id && r.student_id === student.id,
          );
          let estado = "Presente";
          if (record && record.ausencias > 0) {
            estado = `Ausente (${record.ausencias}${record.justificada ? ", justificada" : ""})`;
          } else if (record?.tardia) {
            estado = "Tardía";
          }
          return {
            item: session.fecha,
            detalle: `${session.lecciones_impartidas} lecc.`,
            valor: estado,
          };
        }),
        summaryLabel: "% Asistencia",
        summaryValue: `${g.asistencia.toFixed(1)}%`,
        aporteValue: (g.asistencia * rubric.asistencia_pct).toFixed(1),
      };
    });

    const pdfBuffer = await renderRubroDetallePdf({
      section,
      student,
      moduleLabel: meta.label,
      accentColor: meta.accent,
      accentColorLight: meta.accentLight,
      periods: periodRows,
      noteText,
    });

    await sendEmail({
      to: student.contacto_correo,
      subject: `Reporte de ${meta.label} — ${studentFullName}`,
      html: reporteEmailHtml({ studentFullName, sectionLabel, moduleLabel: meta.label, noteText }),
      attachments: [
        {
          filename: `${modulo}-${studentFullName.replace(/\s+/g, "-").toLowerCase()}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo enviar el reporte." };
  }
}
