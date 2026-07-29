"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCommunicationTemplate(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const texto = String(formData.get("texto") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const materia = String(formData.get("materia") ?? "").trim();
  const nivel = String(formData.get("nivel") ?? "").trim();
  if (!texto) throw new Error("Falta el texto de la plantilla.");

  const { error } = await supabase.from("communication_templates").insert({
    owner_id: user.id,
    texto,
    categoria: categoria || null,
    materia: materia || null,
    nivel: nivel || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/plantillas");
}

export async function updateCommunicationTemplate(templateId: string, formData: FormData) {
  const supabase = await createClient();
  const texto = String(formData.get("texto") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const materia = String(formData.get("materia") ?? "").trim();
  const nivel = String(formData.get("nivel") ?? "").trim();
  if (!texto) throw new Error("Falta el texto de la plantilla.");

  const { error } = await supabase
    .from("communication_templates")
    .update({
      texto,
      categoria: categoria || null,
      materia: materia || null,
      nivel: nivel || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", templateId);
  if (error) throw new Error(error.message);

  revalidatePath("/plantillas");
}

export async function deleteCommunicationTemplate(templateId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("communication_templates").delete().eq("id", templateId);
  if (error) throw new Error(error.message);
  revalidatePath("/plantillas");
}

export async function toggleFavoritoCommunicationTemplate(templateId: string, favorito: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("communication_templates")
    .update({ favorito })
    .eq("id", templateId);
  if (error) throw new Error(error.message);
  revalidatePath("/plantillas");
}
