import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { ObservationsManager } from "@/components/observations-manager";
import type { ObservationTemplate } from "@/lib/types";

export default async function ObservacionesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();

  const { data: observations } = await supabase
    .from("observation_templates")
    .select("*")
    .eq("owner_id", user.id)
    .order("favorito", { ascending: false })
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Observaciones reutilizables</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Frases y comentarios que usás seguido, para no escribirlos de cero cada vez. Se pueden
        insertar desde Apoyos e Instrumentos.
      </p>

      <div className="mt-6">
        <ObservationsManager observations={(observations as ObservationTemplate[]) ?? []} />
      </div>
    </div>
  );
}
