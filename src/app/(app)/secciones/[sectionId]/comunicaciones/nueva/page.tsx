import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { createComunicacion } from "@/lib/actions/communications";
import { ComunicacionForm } from "@/components/comunicacion-form";
import type { ObservationTemplate, Period, Student } from "@/lib/types";

export default async function NuevaComunicacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sectionId: string }>;
  searchParams: Promise<{ student?: string }>;
}) {
  const { sectionId } = await params;
  const { student: preselectedStudentId } = await searchParams;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const [{ data: students }, { data: periods }, { data: section }, { data: observations }] =
    await Promise.all([
      supabase
        .from("students")
        .select("*")
        .eq("section_id", sectionId)
        .eq("estado", "activo")
        .is("deleted_at", null)
        .order("numero"),
      supabase.from("periods").select("*").eq("section_id", sectionId).order("numero"),
      supabase.from("sections").select("nombre, asignatura").eq("id", sectionId).single(),
      user
        ? supabase.from("observation_templates").select("*").eq("owner_id", user.id).order("favorito", { ascending: false })
        : Promise.resolve({ data: [] as ObservationTemplate[] }),
    ]);

  const studentList = (students as Student[]) ?? [];
  const periodList = (periods as Period[]) ?? [];
  const sec = section as { nombre: string; asignatura: string } | null;
  const createForSection = createComunicacion.bind(null, sectionId);

  if (studentList.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-sm text-zinc-500">
        Todavía no tenés estudiantes activos en esta sección.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-8 sm:py-10">
      <Link
        href={`/secciones/${sectionId}/comunicaciones`}
        className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
      >
        ← Volver a Comunicaciones
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Nueva comunicación</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Se guarda como borrador — la enviás o la registrás como realizada después.
      </p>

      <div className="mt-6">
        <ComunicacionForm
          action={createForSection}
          students={studentList}
          observations={(observations as ObservationTemplate[]) ?? []}
          sectionLabel={sec ? `${sec.asignatura} — ${sec.nombre}` : ""}
          periodoLabel={periodList[0]?.nombre}
          initial={{ studentId: preselectedStudentId }}
          submitLabel="Guardar borrador"
        />
      </div>
    </div>
  );
}
