import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { InstrumentsList } from "@/components/instruments-list";
import type { Instrument } from "@/lib/types";

export default async function InstrumentosPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();

  const { data: instruments } = await supabase
    .from("instruments")
    .select("*")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Instrumentos de evaluación</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Rúbricas, listas de cotejo, escalas de valoración y registros anecdóticos que podés
            reutilizar entre secciones.
          </p>
        </div>
        <Link
          href="/instrumentos/nuevo"
          className="shrink-0 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          + Nuevo
        </Link>
      </div>

      <InstrumentsList instruments={(instruments as Instrument[]) ?? []} />
    </div>
  );
}
