"use server";

import { createClient } from "@/lib/supabase/server";

export type InstitutionSearchResult = {
  id: string;
  nombre: string;
  canton: string | null;
  provincia: string | null;
  direccion_regional: string | null;
  circuito: string | null;
  codigo_presupuestario: string | null;
};

export async function searchInstitutions(query: string): Promise<InstitutionSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("institutions")
    .select("id, nombre, canton, provincia, direccion_regional, circuito, codigo_presupuestario")
    .ilike("nombre", `%${trimmed}%`)
    .order("nombre")
    .limit(20);

  return data ?? [];
}
