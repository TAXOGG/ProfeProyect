import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveSections } from "@/lib/sections-data";
import { getAttendanceAlerts } from "@/lib/attendance-alerts";
import { SectionsFilterList } from "@/components/sections-filter-list";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [list, { count: archivadasCount }] = await Promise.all([
    getActiveSections(),
    supabase
      .from("sections")
      .select("id", { count: "exact", head: true })
      .eq("archivada", true),
  ]);

  const alerts = await getAttendanceAlerts(list);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Mis secciones</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Elige una sección para registrar calificaciones, o crea una nueva.
      </p>

      {alerts.length > 0 && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-red-800">
            <span aria-hidden>⚠️</span>
            Alertas tempranas de asistencia ({alerts.length})
          </p>
          <p className="mt-0.5 text-xs text-red-700">
            Estudiantes que ya cruzaron el umbral de ausencias injustificadas que configuraste en
            Ajustes para el periodo activo.
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {alerts.map((a) => (
              <li key={`${a.sectionId}-${a.studentId}`}>
                <Link
                  href={`/secciones/${a.sectionId}/estudiantes/${a.studentId}/expediente`}
                  className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-1.5 text-sm hover:bg-red-100"
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        a.nivel === "rojo" ? "bg-red-500" : "bg-amber-400"
                      }`}
                    />
                    <span className="font-medium text-zinc-900">{a.studentName}</span>
                    <span className="text-zinc-400">· {a.sectionLabel}</span>
                  </span>
                  <span
                    className={`shrink-0 font-semibold ${
                      a.nivel === "rojo" ? "text-red-700" : "text-amber-700"
                    }`}
                  >
                    {a.ausenciasPct.toFixed(1)}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

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

      <SectionsFilterList sections={list} />

      <div className="mt-3 flex flex-col gap-3">
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
