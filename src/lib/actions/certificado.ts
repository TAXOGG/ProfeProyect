"use server";

import { fetchSectionGradesData } from "@/lib/section-grades-data";
import { renderCertificadoNotasPdf } from "@/lib/pdf/certificado-notas";
import { sendEmail, LOGO_URL } from "@/lib/email";

export type SendCertificateResult = { success?: boolean; error?: string };

function certificadoEmailHtml(input: { studentFullName: string; sectionLabel: string }) {
  const { studentFullName, sectionLabel } = input;
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
    Adjunto encontrará el certificado de calificaciones de <strong>${studentFullName}</strong>
    correspondiente a <strong>${sectionLabel}</strong>.
  </p>
  <p style="font-size: 14px; line-height: 1.5;">
    Este documento se generó automáticamente a partir del registro de notas que lleva el
    docente y es de carácter informativo.
  </p>
  <p style="font-size: 12px; color: #71717a; margin-top: 24px;">
    Este correo fue enviado por ARCE (Agilización de Registros para la Calificación del
    Educador) a solicitud del docente a cargo.
  </p>
</div>`.trim();
}

export async function sendCertificadoNotas(
  sectionId: string,
  studentId: string,
): Promise<SendCertificateResult> {
  const data = await fetchSectionGradesData(sectionId, studentId);
  if (!data) return { error: "No se encontró la sección." };

  const { section, periods, grades } = data;
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

  try {
    const pdfBuffer = await renderCertificadoNotasPdf({
      section,
      student,
      periods,
      grades: studentGrades,
    });

    await sendEmail({
      to: student.contacto_correo,
      subject: `Certificado de calificaciones — ${studentFullName}`,
      html: certificadoEmailHtml({ studentFullName, sectionLabel }),
      attachments: [
        {
          filename: `certificado-${studentFullName.replace(/\s+/g, "-").toLowerCase()}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo enviar el certificado." };
  }
}
