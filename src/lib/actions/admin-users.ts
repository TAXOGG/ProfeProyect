"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateInstitution } from "@/lib/actions/sections";
import { sendEmail, LOGO_URL, SITE_URL } from "@/lib/email";

// Distinta de ADMIN_EMAIL (esa es a dónde llegan los avisos de solicitudes
// de acceso). Esta decide quién puede entrar a /admin/nuevo-usuario.
const ADMIN_LOGIN_EMAIL = process.env.ADMIN_LOGIN_EMAIL || "docente.prueba@profeproyecto.local";

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.email !== ADMIN_LOGIN_EMAIL) {
    redirect("/dashboard");
  }
  return user;
}

function welcomeEmailHtml({ nombre, actionUrl }: { nombre: string; actionUrl: string }) {
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
  <p style="font-size: 14px; line-height: 1.5;">Hola ${nombre},</p>
  <p style="font-size: 14px; line-height: 1.5;">
    Te creamos tu cuenta en <strong>ARCE</strong>, la herramienta para llevar el registro de
    notas y asistencia sin depender de Excel. Antes de entrar, elegí tu contraseña:
  </p>
  <p style="text-align: center; margin: 24px 0;">
    <a href="${actionUrl}" style="display: inline-block; background: #0f766e; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">
      Configurar mi contraseña
    </a>
  </p>
  <p style="font-size: 12px; color: #71717a; line-height: 1.5;">
    Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br>
    <a href="${actionUrl}" style="color: #0f766e;">${actionUrl}</a>
  </p>
</div>`.trim();
}

export async function createTeacherAccount(formData: FormData) {
  await requireAdmin();

  const correo = String(formData.get("correo") ?? "").trim().toLowerCase();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const institucionId = String(formData.get("institucion_id") ?? "").trim();
  const institucionNombre = String(formData.get("institucion_nombre") ?? "").trim();
  const direccionRegional = String(formData.get("direccion_regional") ?? "").trim();
  const circuito = String(formData.get("circuito") ?? "").trim();
  const provincia = String(formData.get("provincia") ?? "").trim();
  const canton = String(formData.get("canton") ?? "").trim();

  if (!correo || !nombre || (!institucionId && !institucionNombre)) {
    throw new Error("Correo, nombre e institución son obligatorios.");
  }

  // La institución se busca/crea con la sesión normal del admin (RLS ya
  // permite leer el catálogo compartido de instituciones); solo la creación
  // del usuario en sí necesita privilegios elevados.
  const supabase = await createClient();
  const institutionId = institucionId
    ? institucionId
    : await findOrCreateInstitution(
        supabase,
        institucionNombre,
        direccionRegional,
        circuito,
        provincia,
        canton,
      );

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "invite",
    email: correo,
    options: { data: { full_name: nombre, institution_id: institutionId } },
  });

  if (error || !data.properties?.hashed_token) {
    throw new Error(error?.message ?? "No se pudo crear la cuenta.");
  }

  const actionUrl = `${SITE_URL}/auth/confirm?token_hash=${data.properties.hashed_token}&type=invite&next=/configurar-cuenta`;

  await sendEmail({
    to: correo,
    subject: "Bienvenido/a a ARCE — configurá tu cuenta",
    html: welcomeEmailHtml({ nombre, actionUrl }),
  });

  redirect("/admin/nuevo-usuario?creado=1");
}

export async function updateUserProfile(userId: string, formData: FormData) {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const rol = String(formData.get("role") ?? "").trim();
  const institucionId = String(formData.get("institucion_id") ?? "").trim();
  const institucionNombre = String(formData.get("institucion_nombre") ?? "").trim();
  const direccionRegional = String(formData.get("direccion_regional") ?? "").trim();
  const circuito = String(formData.get("circuito") ?? "").trim();
  const provincia = String(formData.get("provincia") ?? "").trim();
  const canton = String(formData.get("canton") ?? "").trim();

  if (!nombre) throw new Error("Falta el nombre.");
  if (rol !== "admin" && rol !== "docente") throw new Error("Rol inválido.");
  if (!institucionId && !institucionNombre) {
    throw new Error("Falta elegir la institución.");
  }

  // La institución se busca/crea con la sesión normal del admin, igual que
  // en la creación de cuentas; solo el UPDATE sobre el perfil de OTRO
  // usuario necesita el cliente de service role (RLS solo deja a cada quien
  // actualizar su propio perfil).
  const supabase = await createClient();
  const institutionId = institucionId
    ? institucionId
    : await findOrCreateInstitution(
        supabase,
        institucionNombre,
        direccionRegional,
        circuito,
        provincia,
        canton,
      );

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("profiles")
    .update({ full_name: nombre, role: rol, institution_id: institutionId })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/usuarios");
}
