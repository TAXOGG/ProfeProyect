import { createClient } from "@/lib/supabase/server";
import { createStudent } from "@/lib/actions/students";
import { StudentsTable } from "@/components/students-table";
import { StudentImportForm } from "@/components/student-import-form";
import { ModuleCounters } from "@/components/module-counters";
import { moduleColor } from "@/lib/module-colors";
import type { Student } from "@/lib/types";

export default async function EstudiantesPage({
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
    .order("numero");

  const list = (students as Student[]) ?? [];
  const activos = list.filter((s) => s.estado === "activo").length;
  const trasladados = list.filter((s) => s.estado === "trasladado").length;
  const salidos = list.filter((s) => s.estado === "salido").length;
  const createStudentForSection = createStudent.bind(null, sectionId);

  const color = moduleColor("estudiantes");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className={`rounded-lg border px-4 py-3 sm:px-5 sm:py-4 ${color.headerBg} ${color.headerBorder}`}>
          <h2 className="text-lg font-semibold text-zinc-900">Estudiantes</h2>
          <p className="text-sm text-zinc-600">Lista de la sección.</p>
        </div>

        <div className="mt-3">
          <ModuleCounters
            items={[
              { label: "total", value: list.length },
              { label: "activos", value: activos },
              { label: "trasladados", value: trasladados },
              { label: "salidos", value: salidos },
            ]}
          />
        </div>

        <StudentsTable sectionId={sectionId} students={list} />
      </div>

      <StudentImportForm sectionId={sectionId} />

      <div className="max-w-lg rounded-lg border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-900">Agregar estudiante</h3>
        <form action={createStudentForSection} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            name="primer_apellido"
            placeholder="1er apellido"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="segundo_apellido"
            placeholder="2do apellido"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="nombre"
            placeholder="Nombre"
            required
            className="col-span-2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="identificacion"
            placeholder="Identificación"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <select name="sexo" defaultValue="" className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
            <option value="" disabled>
              Sexo
            </option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
          <input
            name="tipo_apoyo"
            placeholder="Tipo de apoyo (opcional)"
            defaultValue="No tiene"
            className="col-span-2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="col-span-2 mt-1 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Agregar
          </button>
        </form>
      </div>
    </div>
  );
}
