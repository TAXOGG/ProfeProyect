import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { moduleColor } from "@/lib/module-colors";
import { SupportRecordsList } from "@/components/support-records-list";
import type { SupportRecord } from "@/lib/types";

export default async function ApoyosPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  const supabase = await createClient();

  const { data: records } = await supabase
    .from("support_records")
    .select("*, students ( primer_apellido, segundo_apellido, nombre )")
    .eq("section_id", sectionId)
    .order("fecha", { ascending: false });

  const rows = (records ?? []).map((r) => {
    const s = r.students as unknown as {
      primer_apellido: string;
      segundo_apellido: string | null;
      nombre: string;
    } | null;
    return {
      ...(r as unknown as SupportRecord),
      studentName: s ? `${s.primer_apellido} ${s.segundo_apellido ?? ""} ${s.nombre}`.replace(/\s+/g, " ").trim() : "—",
    };
  });

  const color = moduleColor("estudiantes");

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 sm:px-5 sm:py-4 ${color.headerBg} ${color.headerBorder}`}
      >
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Apoyos educativos</h2>
          <p className="text-sm text-zinc-600">
            Adecuaciones y apoyos aplicados a estudiantes de esta sección, con seguimiento.
          </p>
        </div>
        <Link
          href={`/secciones/${sectionId}/apoyos/nuevo`}
          className="shrink-0 rounded-md bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          + Nuevo
        </Link>
      </div>

      <SupportRecordsList sectionId={sectionId} records={rows} />
    </div>
  );
}
