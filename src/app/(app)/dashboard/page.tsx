import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Section, SectionWithInstitution } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: sections }, { count: archivadasCount }] = await Promise.all([
    supabase
      .from("sections")
      .select("*, institutions ( nombre )")
      .eq("teacher_id", user!.id)
      .eq("archivada", false)
      .order("ciclo_escolar", { ascending: false }),
    supabase
      .from("sections")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", user!.id)
      .eq("archivada", true),
  ]);

  const list: SectionWithInstitution[] = (sections ?? []).map((s) => ({
    ...(s as unknown as Section),
    institutionNombre: (s.institutions as unknown as { nombre: string } | null)?.nombre ?? "",
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Mis secciones</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Elige una sección para registrar calificaciones, o crea una nueva.
      </p>

      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <span aria-hidden className="mt-0.5">
          📶
        </span>
        <p>
          <strong>Funciona aunque se corte el internet.</strong> En Cotidiano, Pruebas, Tareas,
          Proyecto y Asistencia, lo que registrés queda guardado en tu dispositivo y se sube solo
          apenas vuelva la conexión — no perdés nada. Solo entra primero a cada sección una vez
          con internet para que quede lista.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {list.map((s) => (
          <Link
            key={s.id}
            href={`/secciones/${s.id}/estudiantes`}
            className="rounded-lg border border-zinc-200 bg-white px-5 py-4 shadow-sm hover:border-zinc-400"
          >
            <p className="font-medium text-zinc-900">
              {s.asignatura} — {s.nombre}
            </p>
            <p className="text-sm text-zinc-500">
              {s.institutionNombre} · {s.nivel} · Ciclo {s.ciclo_escolar}
            </p>
          </Link>
        ))}

        {list.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-300 px-5 py-6 text-center text-sm text-zinc-500">
            Aún no tienes secciones registradas.
          </p>
        )}

        <Link
          href="/secciones/nueva"
          className="rounded-lg border border-zinc-300 border-dashed px-5 py-4 text-center text-sm font-medium text-zinc-600 hover:bg-zinc-100"
        >
          + Nueva sección
        </Link>

        {(archivadasCount ?? 0) > 0 && (
          <Link
            href="/secciones/archivadas"
            className="text-center text-xs font-medium text-zinc-500 underline hover:text-zinc-800"
          >
            Ver secciones archivadas ({archivadasCount})
          </Link>
        )}
      </div>
    </div>
  );
}
