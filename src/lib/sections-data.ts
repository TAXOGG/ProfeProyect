import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Section, SectionWithInstitution } from "@/lib/types";

// cache() memoiza por request: el layout y la página del dashboard piden
// exactamente las mismas secciones activas, y con esto Next.js solo hace
// la consulta a Supabase una vez por navegación en vez de dos.
export const getActiveSections = cache(async (): Promise<SectionWithInstitution[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sections")
    .select("*, institutions ( nombre )")
    .eq("archivada", false)
    .order("ciclo_escolar", { ascending: false });

  return (data ?? []).map((s) => ({
    ...(s as unknown as Section),
    institutionNombre: (s.institutions as unknown as { nombre: string } | null)?.nombre ?? "",
  }));
});

export type SectionHeader = {
  nombre: string;
  nivel: string;
  asignatura: string;
  ciclo_escolar: number;
  institutions: { nombre: string } | null;
} | null;

// Mismo motivo que arriba: el layout de sección solo necesita los campos de
// encabezado, y cache() evita repetir esta consulta si otra parte del mismo
// render la vuelve a pedir.
export const getSectionById = cache(async (sectionId: string): Promise<SectionHeader> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sections")
    .select("nombre, nivel, asignatura, ciclo_escolar, institutions ( nombre )")
    .eq("id", sectionId)
    .single();
  return data as SectionHeader;
});
