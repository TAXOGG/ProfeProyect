"use server";

import { createClient } from "@/lib/supabase/server";

const CATEGORIAS = ["error", "sugerencia", "duda", "otro"] as const;
export type FeedbackCategoria = (typeof CATEGORIAS)[number];

export type SubmitFeedbackResult = { success?: boolean; error?: string };

export async function submitFeedback(input: {
  categoria: FeedbackCategoria;
  mensaje: string;
  ruta: string;
  sectionId: string | null;
}): Promise<SubmitFeedbackResult> {
  if (!CATEGORIAS.includes(input.categoria)) {
    return { error: "Categoría inválida." };
  }
  const mensaje = input.mensaje.trim();
  if (!mensaje) {
    return { error: "Escribe un mensaje antes de enviar." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { data: recientes } = await supabase.rpc("count_recent_feedback", {
    p_user_id: user.id,
  });
  if ((recientes ?? 0) >= 10) {
    return { error: "Enviaste varios mensajes seguidos. Espera un rato antes de enviar otro." };
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    categoria: input.categoria,
    mensaje,
    ruta: input.ruta,
    section_id: input.sectionId,
  });

  if (error) return { error: error.message };
  return { success: true };
}
