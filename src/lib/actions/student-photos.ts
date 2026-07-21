"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "student-photos";
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

/**
 * El "type" que reporta el navegador en un File es un dato del cliente, no confiable
 * (se puede falsificar). Antes de guardar cualquier archivo, se confirma el formato real
 * leyendo los primeros bytes, en vez de confiar en lo que el cliente dice que es.
 */
function detectImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (bytes.length >= 12) {
    const brand = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    const major = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (brand === "ftyp" && ["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(major)) {
      return "image/heic";
    }
  }
  return null;
}

export type UploadPhotoResult = { error?: string; success?: boolean };

export async function uploadStudentPhoto(
  sectionId: string,
  studentId: string,
  _prev: UploadPhotoResult | null,
  formData: FormData,
): Promise<UploadPhotoResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada, vuelve a ingresar." };

  const file = formData.get("foto");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona o toma una foto." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: "La foto pesa más de 10MB. Intenta con una foto de menor resolución." };
  }

  const headerBytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const realType = detectImageType(headerBytes);
  if (!realType) {
    return { error: "Solo se aceptan fotos (JPG, PNG, HEIC o WEBP)." };
  }

  const categoria = String(formData.get("categoria") ?? "").trim() || null;
  const nota = String(formData.get("nota") ?? "").trim() || null;
  const ext = EXT_BY_TYPE[realType] ?? "jpg";
  const path = `${user.id}/${studentId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: realType,
  });
  if (uploadError) return { error: uploadError.message };

  const { error: insertError } = await supabase.from("student_photos").insert({
    student_id: studentId,
    section_id: sectionId,
    categoria,
    nota,
    storage_path: path,
  });
  if (insertError) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: insertError.message };
  }

  revalidatePath(`/secciones/${sectionId}/estudiantes/${studentId}/fotos`);
  return { success: true };
}

export async function deleteStudentPhoto(
  sectionId: string,
  studentId: string,
  photoId: string,
  storagePath: string,
) {
  const supabase = await createClient();
  await supabase.storage.from(BUCKET).remove([storagePath]);
  const { error } = await supabase.from("student_photos").delete().eq("id", photoId);
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/estudiantes/${studentId}/fotos`);
}
