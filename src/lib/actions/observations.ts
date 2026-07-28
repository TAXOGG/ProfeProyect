"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createObservation(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const texto = String(formData.get("texto") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const materia = String(formData.get("materia") ?? "").trim();
  const nivel = String(formData.get("nivel") ?? "").trim();
  if (!texto) throw new Error("Falta el texto de la observación.");

  const { error } = await supabase.from("observation_templates").insert({
    owner_id: user.id,
    texto,
    categoria: categoria || null,
    materia: materia || null,
    nivel: nivel || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/observaciones");
}

export async function updateObservation(observationId: string, formData: FormData) {
  const supabase = await createClient();
  const texto = String(formData.get("texto") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const materia = String(formData.get("materia") ?? "").trim();
  const nivel = String(formData.get("nivel") ?? "").trim();
  if (!texto) throw new Error("Falta el texto de la observación.");

  const { error } = await supabase
    .from("observation_templates")
    .update({
      texto,
      categoria: categoria || null,
      materia: materia || null,
      nivel: nivel || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", observationId);
  if (error) throw new Error(error.message);

  revalidatePath("/observaciones");
}

export async function deleteObservation(observationId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("observation_templates").delete().eq("id", observationId);
  if (error) throw new Error(error.message);
  revalidatePath("/observaciones");
}

export async function toggleFavorito(observationId: string, favorito: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("observation_templates")
    .update({ favorito })
    .eq("id", observationId);
  if (error) throw new Error(error.message);
  revalidatePath("/observaciones");
}
