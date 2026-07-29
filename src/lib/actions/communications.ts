"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildInformeIntegralData } from "@/lib/actions/informe";
import { renderInformeIntegralPdf } from "@/lib/pdf/informe-integral";
import { sendEmail, LOGO_URL } from "@/lib/email";
import { TIPO_LABEL } from "@/lib/communication-labels";
import type { ComunicacionMedio, ComunicacionTipo } from "@/lib/types";

const TIPOS: ComunicacionTipo[] = [
  "progreso",
  "ausencia",
  "trabajo_pendiente",
  "convocatoria",
  "reconocimiento",
  "seguimiento",
  "personalizada",
];
const MEDIOS: ComunicacionMedio[] = ["correo", "llamada", "reunion", "mensajeria", "impresa", "otro"];

async function requireComunicacionPreparada(
  supabase: Awaited<ReturnType<typeof createClient>>,
  comunicacionId: string,
) {
  const { data } = await supabase
    .from("communications")
    .select("estado")
    .eq("id", comunicacionId)
    .single();
  if (data && data.estado !== "preparada") {
    throw new Error(
      "Esta comunicación ya quedó registrada como parte del historial y no se puede editar. Agregá una observación nueva si necesitás anotar algo más.",
    );
  }
}

export async function createComunicacion(sectionId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const studentId = String(formData.get("student_id") ?? "").trim();
  const periodId = String(formData.get("period_id") ?? "").trim();
  const tipoRaw = String(formData.get("tipo") ?? "");
  const medioRaw = String(formData.get("medio") ?? "");
  const destinatario = String(formData.get("destinatario") ?? "").trim();
  const mensaje = String(formData.get("mensaje") ?? "").trim();
  const adjuntaInforme = formData.get("adjunta_informe") === "on";

  if (!studentId) throw new Error("Elegí un estudiante.");
  if (!TIPOS.includes(tipoRaw as ComunicacionTipo)) throw new Error("Elegí un tipo de comunicación.");
  if (!MEDIOS.includes(medioRaw as ComunicacionMedio)) throw new Error("Elegí un medio.");
  if (!mensaje) throw new Error("Falta el mensaje.");

  const { data: section } = await supabase.from("sections").select("id").eq("id", sectionId).single();
  if (!section) throw new Error("No se encontró la sección.");

  const { data: created, error } = await supabase
    .from("communications")
    .insert({
      student_id: studentId,
      section_id: sectionId,
      period_id: periodId || null,
      tipo: tipoRaw,
      medio: medioRaw,
      destinatario: destinatario || null,
      mensaje,
      adjunta_informe: adjuntaInforme,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "No se pudo guardar la comunicación.");

  revalidatePath(`/secciones/${sectionId}/comunicaciones`);
  redirect(`/secciones/${sectionId}/comunicaciones/${created.id}`);
}

export async function updateComunicacion(
  sectionId: string,
  comunicacionId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  await requireComunicacionPreparada(supabase, comunicacionId);

  const tipoRaw = String(formData.get("tipo") ?? "");
  const medioRaw = String(formData.get("medio") ?? "");
  const destinatario = String(formData.get("destinatario") ?? "").trim();
  const mensaje = String(formData.get("mensaje") ?? "").trim();
  const adjuntaInforme = formData.get("adjunta_informe") === "on";

  if (!TIPOS.includes(tipoRaw as ComunicacionTipo)) throw new Error("Elegí un tipo de comunicación.");
  if (!MEDIOS.includes(medioRaw as ComunicacionMedio)) throw new Error("Elegí un medio.");
  if (!mensaje) throw new Error("Falta el mensaje.");

  const { error } = await supabase
    .from("communications")
    .update({
      tipo: tipoRaw,
      medio: medioRaw,
      destinatario: destinatario || null,
      mensaje,
      adjunta_informe: adjuntaInforme,
      updated_at: new Date().toISOString(),
    })
    .eq("id", comunicacionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/secciones/${sectionId}/comunicaciones/${comunicacionId}`);
}

export async function addObservacion(sectionId: string, comunicacionId: string, formData: FormData) {
  const supabase = await createClient();
  const observacion = String(formData.get("observacion") ?? "").trim();
  if (!observacion) throw new Error("Falta la observación.");

  const { error } = await supabase
    .from("communications")
    .update({ observacion, updated_at: new Date().toISOString() })
    .eq("id", comunicacionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/secciones/${sectionId}/comunicaciones/${comunicacionId}`);
}

export async function registrarComunicacionRealizada(
  sectionId: string,
  comunicacionId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  await requireComunicacionPreparada(supabase, comunicacionId);

  const fechaRealizada =
    String(formData.get("fecha_realizada") ?? "").trim() || new Date().toISOString().slice(0, 10);
  const observacion = String(formData.get("observacion") ?? "").trim();

  const { error } = await supabase
    .from("communications")
    .update({
      estado: "registrada_manualmente",
      fecha_realizada: fechaRealizada,
      observacion: observacion || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", comunicacionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/secciones/${sectionId}/comunicaciones/${comunicacionId}`);
  revalidatePath(`/secciones/${sectionId}/comunicaciones`);
}

export async function deleteComunicacion(sectionId: string, comunicacionId: string) {
  const supabase = await createClient();
  await requireComunicacionPreparada(supabase, comunicacionId);

  const { error } = await supabase.from("communications").delete().eq("id", comunicacionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/secciones/${sectionId}/comunicaciones`);
  redirect(`/secciones/${sectionId}/comunicaciones`);
}

function comunicacionEmailHtml(input: { mensaje: string }) {
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
  <p style="font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${input.mensaje
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</p>
  <p style="font-size: 12px; color: #71717a; margin-top: 24px;">
    Este correo fue enviado por ARCE (Agilización de Registros para la Calificación del
    Educador) a solicitud del docente a cargo.
  </p>
</div>`.trim();
}

export type SendComunicacionResult = { success?: boolean; error?: string };

export async function sendComunicacionCorreo(
  sectionId: string,
  comunicacionId: string,
): Promise<SendComunicacionResult> {
  const supabase = await createClient();

  const { data: comunicacion } = await supabase
    .from("communications")
    .select("*, students ( contacto_correo, primer_apellido, segundo_apellido, nombre )")
    .eq("id", comunicacionId)
    .single();
  if (!comunicacion) return { error: "No se encontró la comunicación." };
  if (comunicacion.medio !== "correo") {
    return { error: "Esta comunicación no está configurada para envío por correo." };
  }
  if (comunicacion.estado !== "preparada") {
    return { error: "Esta comunicación ya fue registrada." };
  }

  const student = comunicacion.students as unknown as {
    contacto_correo: string | null;
    primer_apellido: string;
    segundo_apellido: string | null;
    nombre: string;
  } | null;
  const correo = comunicacion.destinatario || student?.contacto_correo;
  if (!correo) {
    return { error: "Este estudiante no tiene un correo de contacto registrado." };
  }

  try {
    const attachments: { filename: string; content: Buffer }[] = [];
    if (comunicacion.adjunta_informe) {
      const informeData = await buildInformeIntegralData(sectionId, comunicacion.student_id);
      if (informeData) {
        const pdfBuffer = await renderInformeIntegralPdf(informeData);
        const studentFullName = student
          ? `${student.primer_apellido} ${student.segundo_apellido ?? ""} ${student.nombre}`
              .replace(/\s+/g, " ")
              .trim()
          : "estudiante";
        attachments.push({
          filename: `informe-${studentFullName.replace(/\s+/g, "-").toLowerCase()}.pdf`,
          content: pdfBuffer,
        });
      }
    }

    await sendEmail({
      to: correo,
      subject: TIPO_LABEL[comunicacion.tipo as ComunicacionTipo],
      html: comunicacionEmailHtml({ mensaje: comunicacion.mensaje as string }),
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    const { error } = await supabase
      .from("communications")
      .update({
        estado: "enviada",
        fecha_realizada: new Date().toISOString().slice(0, 10),
        destinatario: comunicacion.destinatario || correo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", comunicacionId);
    if (error) throw new Error(error.message);

    revalidatePath(`/secciones/${sectionId}/comunicaciones/${comunicacionId}`);
    revalidatePath(`/secciones/${sectionId}/comunicaciones`);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo enviar la comunicación." };
  }
}
