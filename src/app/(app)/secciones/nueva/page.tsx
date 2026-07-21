import { createClient } from "@/lib/supabase/server";
import { NuevaSeccionForm } from "@/components/nueva-seccion-form";
import type { SectionWithInstitution } from "@/lib/types";

export default async function NuevaSeccionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sections } = await supabase
    .from("sections")
    .select("*, institutions ( nombre )")
    .eq("teacher_id", user?.id ?? "")
    .order("ciclo_escolar", { ascending: false });

  const existingSections: SectionWithInstitution[] = (sections ?? []).map((s) => ({
    ...s,
    institutionNombre: (s.institutions as unknown as { nombre: string } | null)?.nombre ?? "",
  }));

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Nueva sección</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Cada sección representa un grupo/asignatura que impartes (ej. Física en 10-1).
      </p>

      <NuevaSeccionForm existingSections={existingSections} />
    </div>
  );
}
