import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { moduleColor } from "@/lib/module-colors";
import { BulkInformesForm } from "@/components/bulk-informes-form";
import type { Student } from "@/lib/types";

export default async function InformesMasivosPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("section_id", sectionId)
    .eq("estado", "activo")
    .is("deleted_at", null)
    .order("numero");

  const color = moduleColor("reportes");

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 sm:px-5 sm:py-4 ${color.headerBg} ${color.headerBorder}`}
      >
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Generación masiva de informes</h2>
          <p className="text-sm text-zinc-600">
            Generá el informe integral de varios estudiantes a la vez y descargalos en un solo
            archivo ZIP.
          </p>
        </div>
        <Link
          href={`/secciones/${sectionId}/reportes`}
          className="shrink-0 rounded-md border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          ← Reportes
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <BulkInformesForm sectionId={sectionId} students={(students as Student[]) ?? []} />
      </div>
    </div>
  );
}
