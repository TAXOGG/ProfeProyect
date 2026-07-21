"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { moduleColor } from "@/lib/module-colors";
import type { SectionWithInstitution } from "@/lib/types";

const MODULES = [
  { slug: "estudiantes", label: "Estudiantes" },
  { slug: "cotidiano", label: "Trabajo Cotidiano" },
  { slug: "pruebas", label: "Pruebas" },
  { slug: "tareas", label: "Tareas" },
  { slug: "proyecto", label: "Proyecto" },
  { slug: "asistencia", label: "Asistencia" },
  { slug: "reportes", label: "Reportes" },
  { slug: "ajustes", label: "Ajustes" },
];

export function Sidebar({
  teacherName,
  sections,
}: {
  teacherName: string;
  sections: SectionWithInstitution[];
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }
  const match = pathname.match(/^\/secciones\/([^/]+)/);
  const currentSectionId = match?.[1];
  const currentSection = sections.find((s) => s.id === currentSectionId);

  return (
    <>
      <div className="no-print flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path
              fillRule="evenodd"
              d="M3 5.75A.75.75 0 013.75 5h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 5.75zm0 4.5A.75.75 0 013.75 9.5h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 10.25zm0 4.5a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <p className="text-sm font-semibold text-zinc-900">
          {currentSection ? currentSection.nombre : "ARCE"}
        </p>
        <div className="w-9" />
      </div>

      {mobileOpen && (
        <div
          className="no-print fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`no-print fixed inset-y-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-zinc-200 bg-white transition-[left] duration-200 md:static md:left-0 ${
          mobileOpen ? "left-0" : "-left-64"
        }`}
      >
        <Link
          href="/dashboard"
          prefetch={false}
          className="flex items-center gap-2.5 border-b border-zinc-200 px-5 py-4 hover:bg-zinc-50"
        >
          <Image
            src="/logo-arce.png"
            alt=""
            width={28}
            height={28}
            unoptimized
            className="shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900">ARCE</p>
            {teacherName && (
              <p className="truncate text-xs text-zinc-500">{teacherName}</p>
            )}
          </div>
        </Link>

        <div className="border-b border-zinc-200 px-3 py-3">
          <label className="px-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Sección
          </label>
          <select
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
            value={currentSectionId ?? ""}
            onChange={(e) => {
              const id = e.target.value;
              if (id) window.location.href = `/secciones/${id}/estudiantes`;
            }}
          >
            <option value="" disabled>
              {sections.length ? "Selecciona una sección" : "Sin secciones aún"}
            </option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.institutionNombre ? `${s.institutionNombre} · ` : ""}
                {s.asignatura} — {s.nombre}
              </option>
            ))}
          </select>
          <Link
            href="/secciones/nueva"
            prefetch={false}
            className="mt-2 block rounded-md px-2 py-1.5 text-center text-xs font-medium text-zinc-600 hover:bg-zinc-100"
          >
            + Nueva sección
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          <Link
            href="/dashboard"
            prefetch={false}
            className={`block rounded-md px-3 py-2 text-sm ${
              pathname === "/dashboard"
                ? "bg-teal-700 text-white"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            Inicio
          </Link>

          {currentSection && (
            <>
              <p className="px-3 pt-4 pb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
                {currentSection.nombre}
              </p>
              {MODULES.map((m) => {
                const href = `/secciones/${currentSection.id}/${m.slug}`;
                const active = pathname.startsWith(href);
                const color = moduleColor(m.slug);
                return (
                  <Link
                    key={m.slug}
                    href={href}
                    prefetch={false}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                      active ? "bg-teal-700 text-white" : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        active ? "bg-white" : color.dot
                      }`}
                    />
                    {m.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <form action="/auth/signout" method="post" className="border-t border-zinc-200 p-3">
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-100"
          >
            Cerrar sesión
          </button>
        </form>
      </aside>
    </>
  );
}
