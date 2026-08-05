import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { InstitutionLogoCard } from "@/components/institution-logo-card";

export default async function InstitucionPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();

  const { data: sections } = await supabase
    .from("sections")
    .select("institution_id, institutions ( id, nombre, logo_path )")
    .eq("teacher_id", user.id)
    .eq("archivada", false);

  const seen = new Set<string>();
  const institutions = (sections ?? [])
    .map((s) => s.institutions as unknown as { id: string; nombre: string; logo_path: string | null } | null)
    .filter((i): i is { id: string; nombre: string; logo_path: string | null } => {
      if (!i || seen.has(i.id)) return false;
      seen.add(i.id);
      return true;
    });

  const logoUrlById = new Map(
    institutions
      .filter((i) => i.logo_path)
      .map((i) => [
        i.id,
        supabase.storage.from("institution-logos").getPublicUrl(i.logo_path!).data.publicUrl,
      ]),
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Mi institución</h1>
      <p className="mt-1 text-sm text-zinc-500">
        El logo que subas aquí aparece en el certificado de notas, el informe integral y los
        reportes por rubro que generes para esta institución. Como es un catálogo compartido,
        cualquier docente con secciones activas ahí puede actualizarlo.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {institutions.length === 0 && (
          <p className="text-sm text-zinc-400">
            Todavía no tenés secciones activas en ninguna institución.
          </p>
        )}
        {institutions.map((inst) => (
          <InstitutionLogoCard
            key={inst.id}
            institutionId={inst.id}
            nombre={inst.nombre}
            logoUrl={logoUrlById.get(inst.id) ?? null}
          />
        ))}
      </div>
    </div>
  );
}
