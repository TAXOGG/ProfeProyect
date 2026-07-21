import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArchivedSectionRow } from "@/components/archived-section-row";
import type { Section, SectionWithInstitution } from "@/lib/types";

export default async function SeccionesArchivadasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sections } = await supabase
    .from("sections")
    .select("*, institutions ( nombre )")
    .eq("teacher_id", user!.id)
    .eq("archivada", true)
    .order("ciclo_escolar", { ascending: false });

  const list: SectionWithInstitution[] = (sections ?? []).map((s) => ({
    ...(s as unknown as Section),
    institutionNombre: (s.institutions as unknown as { nombre: string } | null)?.nombre ?? "",
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
      <Link href="/dashboard" className="text-xs font-medium text-zinc-500 hover:text-zinc-800">
        ← Volver al inicio
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Secciones archivadas</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Estas secciones no aparecen en el inicio ni en el menú, pero conservan toda su
        información. Puedes restaurarlas cuando quieras.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {list.map((s) => (
          <ArchivedSectionRow key={s.id} section={s} />
        ))}

        {list.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-300 px-5 py-6 text-center text-sm text-zinc-500">
            No tienes secciones archivadas.
          </p>
        )}
      </div>
    </div>
  );
}
