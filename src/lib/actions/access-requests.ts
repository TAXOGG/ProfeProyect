"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail, LOGO_URL } from "@/lib/email";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "jorgeriv20770@gmail.com";

function accessRequestEmailHtml(input: {
  nombre: string;
  correo: string;
  institucion: string;
  telefono: string;
  mensaje: string;
}) {
  const { nombre, correo, institucion, telefono, mensaje } = input;
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
  <p style="font-size: 14px; line-height: 1.5;">Nueva solicitud de acceso:</p>
  <table style="font-size: 14px; line-height: 1.6;">
    <tr><td style="color: #71717a; padding-right: 12px;">Nombre</td><td><strong>${nombre}</strong></td></tr>
    <tr><td style="color: #71717a; padding-right: 12px;">Correo</td><td>${correo}</td></tr>
    <tr><td style="color: #71717a; padding-right: 12px;">Institución</td><td>${institucion}</td></tr>
    <tr><td style="color: #71717a; padding-right: 12px;">Teléfono</td><td>${telefono || "—"}</td></tr>
  </table>
  ${mensaje ? `<p style="font-size: 14px; line-height: 1.5; margin-top: 12px;"><strong>Mensaje:</strong><br>${mensaje}</p>` : ""}
</div>`.trim();
}

export async function createAccessRequest(formData: FormData) {
  const supabase = await createClient();

  // Honeypot: campo oculto que un usuario real nunca llena. Si viene con
  // contenido, es casi seguro un bot — se descarta en silencio (sin avisarle
  // al bot que falló, ni guardar nada).
  const honeypot = String(formData.get("sitio_web") ?? "").trim();
  if (honeypot) return;

  const nombre = String(formData.get("nombre") ?? "").trim();
  const correo = String(formData.get("correo") ?? "").trim();
  const institucion = String(formData.get("institucion") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const mensaje = String(formData.get("mensaje") ?? "").trim();

  if (!nombre || !correo || !institucion) {
    throw new Error("Nombre, correo e institución son obligatorios.");
  }

  const { data: recientes } = await supabase.rpc("count_recent_access_requests", {
    p_correo: correo,
  });
  if ((recientes ?? 0) >= 3) {
    throw new Error("Ya enviaste varias solicitudes recientemente. Intenta de nuevo más tarde.");
  }

  const { error } = await supabase.from("access_requests").insert({
    nombre,
    correo,
    institucion,
    telefono: telefono || null,
    mensaje: mensaje || null,
  });

  if (error) throw new Error(error.message);

  try {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `Nueva solicitud de acceso — ${nombre}`,
      html: accessRequestEmailHtml({ nombre, correo, institucion, telefono, mensaje }),
    });
  } catch {
    // La solicitud ya quedó guardada en access_requests; si el correo de
    // aviso falla (ej. Resend sin configurar) no debe tumbar el formulario,
    // el dueño igual puede revisar las solicitudes desde Supabase.
  }
}
