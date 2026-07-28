import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { ApplyInstrumentForm } from "@/components/apply-instrument-form";
import type { InstrumentTipo } from "@/lib/types";

export default async function AplicarInstrumentoPage({
  params,
}: {
  params: Promise<{ instrumentId: string }>;
}) {
  const { instrumentId } = await params;
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();

  const [{ data: instrument }, { data: sections }] = await Promise.all([
    supabase.from("instruments").select("nombre, tipo").eq("id", instrumentId).single(),
    supabase
      .from("sections")
      .select("id, nombre, asignatura, periods ( id, nombre, numero, estado )")
      .eq("teacher_id", user.id)
      .eq("archivada", false)
      .order("nombre"),
  ]);

  if (!instrument) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-sm text-zinc-500">
        No se encontró el instrumento.
      </div>
    );
  }

  const sectionOptions = (sections ?? []).map((s) => ({
    id: s.id as string,
    label: `${s.asignatura} — ${s.nombre}`,
    periods: ((s.periods as unknown as { id: string; nombre: string; numero: number; estado: string }[]) ?? [])
      .sort((a, b) => a.numero - b.numero)
      .map((p) => ({ id: p.id, nombre: p.nombre, estado: p.estado })),
  }));

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-8 sm:py-10">
      <Link
        href={`/instrumentos/${instrumentId}`}
        className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
      >
        ← Volver al instrumento
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Aplicar &ldquo;{instrument.nombre}&rdquo;</h1>
      <p className="mt-1 text-sm text-zinc-500">Elegí a qué sección y periodo lo vas a aplicar.</p>

      <div className="mt-6">
        <ApplyInstrumentForm
          instrumentId={instrumentId}
          tipo={instrument.tipo as InstrumentTipo}
          sections={sectionOptions}
        />
      </div>
    </div>
  );
}
