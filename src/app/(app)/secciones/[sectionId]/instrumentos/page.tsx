import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { moduleColor } from "@/lib/module-colors";
import { TIPO_LABEL } from "@/lib/instrument-labels";
import type { InstrumentTipo } from "@/lib/types";

const RUBRO_LABEL: Record<string, string> = {
  cotidiano: "Cotidiano",
  pruebas: "Pruebas",
  tareas: "Tareas",
  proyecto: "Proyecto",
};

export default async function SeccionInstrumentosPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from("instrument_applications")
    .select(
      "id, rubro_destino, fecha, created_at, instruments ( nombre, tipo ), periods ( nombre )",
    )
    .eq("section_id", sectionId)
    .order("created_at", { ascending: false });

  const list = applications ?? [];
  const color = moduleColor("historial");

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 sm:px-5 sm:py-4 ${color.headerBg} ${color.headerBorder}`}
      >
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Instrumentos aplicados</h2>
          <p className="text-sm text-zinc-600">
            Rúbricas, listas de cotejo y registros aplicados a esta sección.
          </p>
        </div>
        <Link
          href="/instrumentos"
          className="no-print shrink-0 rounded-md bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          Aplicar uno
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2">Instrumento</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Periodo</th>
              <th className="px-4 py-2">Rubro</th>
              <th className="px-4 py-2">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {list.map((a) => {
              const instrumento = a.instruments as unknown as { nombre: string; tipo: string } | null;
              const periodo = a.periods as unknown as { nombre: string } | null;
              return (
                <tr key={a.id}>
                  <td className="px-4 py-2 font-medium text-zinc-900">
                    <Link
                      href={`/secciones/${sectionId}/instrumentos/${a.id}`}
                      className="hover:underline"
                    >
                      {instrumento?.nombre ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-500">
                    {TIPO_LABEL[instrumento?.tipo as InstrumentTipo] ?? instrumento?.tipo}
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{periodo?.nombre ?? "—"}</td>
                  <td className="px-4 py-2 text-zinc-500">
                    {a.rubro_destino ? RUBRO_LABEL[a.rubro_destino] : "—"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-zinc-500">{a.fecha}</td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                  Todavía no aplicaste ningún instrumento en esta sección.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
