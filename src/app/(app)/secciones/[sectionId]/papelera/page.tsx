import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PapeleraEstudiantesList } from "@/components/papelera-estudiantes-list";
import type { Student } from "@/lib/types";

export default async function PapeleraPage({
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
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  const list = (students as Student[]) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href={`/secciones/${sectionId}/estudiantes`}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
        >
          ← Volver a Estudiantes
        </Link>
        <h2 className="mt-2 text-lg font-semibold text-zinc-900">Papelera</h2>
        <p className="text-sm text-zinc-600">
          Estudiantes eliminados de esta sección. Se pueden restaurar mientras no se borren para
          siempre.
        </p>
      </div>

      <PapeleraEstudiantesList sectionId={sectionId} students={list} />
    </div>
  );
}
