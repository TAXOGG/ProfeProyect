import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createSupportRecord } from "@/lib/actions/support-records";
import { TIPOS_APOYO_SUGERIDOS } from "@/lib/support-types";
import { StudentCheckboxSelect } from "@/components/student-checkbox-select";
import type { Period, Student } from "@/lib/types";

export default async function NuevoApoyoPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  const supabase = await createClient();

  const [{ data: students }, { data: periods }] = await Promise.all([
    supabase
      .from("students")
      .select("*")
      .eq("section_id", sectionId)
      .eq("estado", "activo")
      .is("deleted_at", null)
      .order("numero"),
    supabase.from("periods").select("*").eq("section_id", sectionId).order("numero"),
  ]);

  const studentList = (students as Student[]) ?? [];
  const periodList = (periods as Period[]) ?? [];
  const createForSection = createSupportRecord.bind(null, sectionId);

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-8 sm:py-10">
      <Link
        href={`/secciones/${sectionId}/apoyos`}
        className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
      >
        ← Volver a Apoyos
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Nuevo apoyo</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Podés aplicarlo a más de un estudiante a la vez si es el mismo apoyo.
      </p>

      <form action={createForSection} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Estudiante(s)</label>
          <StudentCheckboxSelect students={studentList} />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Tipo de apoyo</label>
          <input
            name="tipo_apoyo"
            list="tipos-apoyo"
            required
            placeholder="Ej: Tiempo adicional"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400"
          />
          <datalist id="tipos-apoyo">
            {TIPOS_APOYO_SUGERIDOS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Descripción del apoyo</label>
          <textarea
            name="descripcion"
            required
            rows={2}
            placeholder="Qué se le brindó concretamente"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Motivo o necesidad (opcional)</label>
          <textarea
            name="motivo"
            rows={2}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Actividad o contexto (opcional)</label>
          <input
            name="contexto"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Periodo (opcional)</label>
            <select
              name="period_id"
              defaultValue=""
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Sin periodo específico</option>
              {periodList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Fecha</label>
            <input
              name="fecha"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Responsable (opcional)</label>
          <input
            name="responsable"
            placeholder="Quién brinda el apoyo, si no sos vos"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400"
          />
        </div>

        <div className="rounded-md border border-zinc-200 p-3">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" name="seguimiento_requerido" className="rounded" />
            Requiere seguimiento
          </label>
          <div className="mt-2">
            <label className="block text-xs font-medium text-zinc-600">Próximo seguimiento (opcional)</label>
            <input
              name="proximo_seguimiento"
              type="date"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Guardar apoyo
        </button>
      </form>
    </div>
  );
}
