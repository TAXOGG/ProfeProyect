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
