import { createClient } from "@/lib/supabase/server";
import { LOGO_URL } from "@/lib/email";

let arceLogoCache: Buffer | null = null;

export async function loadArceLogoBuffer(): Promise<Buffer | undefined> {
  if (arceLogoCache) return arceLogoCache;
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) return undefined;
    arceLogoCache = Buffer.from(await res.arrayBuffer());
    return arceLogoCache;
  } catch {
    // El logo es decorativo — si no se puede descargar, el documento igual se genera.
    return undefined;
  }
}

export type InstitutionBranding = { nombre: string; logo?: Buffer };

// El logo de la institución es decorativo: si algo falla (fila borrada,
// bucket sin objeto, red caída), el documento se genera igual sin él.
export async function getInstitutionBranding(
  institutionId: string,
): Promise<InstitutionBranding | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("institutions")
      .select("nombre, logo_path")
      .eq("id", institutionId)
      .single();
    if (!data) return null;

    let logo: Buffer | undefined;
    if (data.logo_path) {
      const { data: pub } = supabase.storage
        .from("institution-logos")
        .getPublicUrl(data.logo_path);
      try {
        const res = await fetch(pub.publicUrl);
        if (res.ok) logo = Buffer.from(await res.arrayBuffer());
      } catch {
        // sin logo, no pasa nada
      }
    }
    return { nombre: data.nombre, logo };
  } catch {
    return null;
  }
}
