"use server";

import { createClient } from "@/lib/supabase/server";

export async function createAccessRequest(formData: FormData) {
  const supabase = await createClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const correo = String(formData.get("correo") ?? "").trim();
  const institucion = String(formData.get("institucion") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const mensaje = String(formData.get("mensaje") ?? "").trim();

  if (!nombre || !correo || !institucion) {
    throw new Error("Nombre, correo e institución son obligatorios.");
  }

  const { error } = await supabase.from("access_requests").insert({
    nombre,
    correo,
    institucion,
    telefono: telefono || null,
    mensaje: mensaje || null,
  });

  if (error) throw new Error(error.message);
}
