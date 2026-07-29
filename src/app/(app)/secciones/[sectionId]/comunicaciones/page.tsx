import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { moduleColor } from "@/lib/module-colors";
import { ComunicacionesList } from "@/components/comunicaciones-list";
import type { Communication } from "@/lib/types";

export default async function ComunicacionesPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("communications")
    .select("*, students ( primer_apellido, segundo_apellido, nombre )")
    .eq("section_id", sectionId)
    .order("created_at", { ascending: false });

  const list = (rows ?? []).map((r) => {
    const s = r.students as unknown as {
      primer_apellido: string;
      segundo_apellido: string | null;
      nombre: string;
    } | null;
    return {
      ...(r as unknown as Communication),
      studentName: s
        ? `${s.primer_apellido} ${s.segundo_apellido ?? ""} ${s.nombre}`.replace(/\s+/g, " ").trim()
        : "—",
    };
  });

  const color = moduleColor("estudiantes");

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 sm:px-5 sm:py-4 ${color.headerBg} ${color.headerBorder}`}
      >
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Comunicaciones con encargados</h2>
          <p className="text-sm text-zinc-600">
            Prepará, enviá y registrá comunicaciones con las familias sobre el progreso del
            estudiante.
          </p>
        </div>
        <Link
          href={`/secciones/${sectionId}/comunicaciones/nueva`}
          className="shrink-0 rounded-md bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          + Nueva
        </Link>
      </div>

      <ComunicacionesList sectionId={sectionId} rows={list} />
    </div>
  );
}
