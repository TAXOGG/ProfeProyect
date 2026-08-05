"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function uploadInstitutionLogo(institutionId: string, formData: FormData) {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona una imagen.");
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new Error("Formato no soportado. Usa PNG, JPG o WEBP.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("La imagen no puede pesar más de 2MB.");
  }

  const supabase = await createClient();
  const path = `${institutionId}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("institution-logos")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const { error: updateError } = await supabase
    .from("institutions")
    .update({ logo_path: path })
    .eq("id", institutionId);
  if (updateError) throw new Error(updateError.message);

  revalidatePath("/institucion");
}

export async function removeInstitutionLogo(institutionId: string) {
  const supabase = await createClient();
  const { data: inst } = await supabase
    .from("institutions")
    .select("logo_path")
    .eq("id", institutionId)
    .single();

  if (inst?.logo_path) {
    await supabase.storage.from("institution-logos").remove([inst.logo_path]);
  }

  const { error } = await supabase
    .from("institutions")
    .update({ logo_path: null })
    .eq("id", institutionId);
  if (error) throw new Error(error.message);

  revalidatePath("/institucion");
}
