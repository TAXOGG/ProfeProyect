"use client";

import { useState } from "react";
import { createSection } from "@/lib/actions/sections";
import { ASIGNATURAS_MEP, NIVELES_MEP, OTRA_OPCION } from "@/lib/catalogs";
import { InstitutionSearch } from "@/components/institution-search";
import type { SectionWithInstitution } from "@/lib/types";

const CICLO_ACTUAL = new Date().getFullYear();

export function NuevaSeccionForm({
  existingSections,
}: {
  existingSections: SectionWithInstitution[];
}) {
  const [asignatura, setAsignatura] = useState("");
  const [nivel, setNivel] = useState("");

  return (
    <form action={createSection} className="mt-6 flex flex-col gap-4">
      <InstitutionSearch />

      <div>
        <label className="block text-sm font-medium text-zinc-700">Asignatura</label>
        <select
          value={asignatura}
          onChange={(e) => setAsignatura(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        >
          <option value="" disabled>
            Selecciona una asignatura
          </option>
          {ASIGNATURAS_MEP.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
          <option value={OTRA_OPCION}>+ Otra asignatura</option>
        </select>
        {asignatura === OTRA_OPCION ? (
          <input
            name="asignatura"
            type="text"
            required
            placeholder="Nombre de la asignatura"
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        ) : (
          <input type="hidden" name="asignatura" value={asignatura} />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Nivel</label>
        <select
          value={nivel}
          onChange={(e) => setNivel(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        >
          <option value="" disabled>
            Selecciona un nivel
          </option>
          {NIVELES_MEP.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
          <option value={OTRA_OPCION}>+ Otro nivel</option>
        </select>
        {nivel === OTRA_OPCION ? (
          <input
            name="nivel"
            type="text"
            required
            placeholder="Nombre del nivel"
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        ) : (
          <input type="hidden" name="nivel" value={nivel} />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Sección</label>
        <input
          name="nombre"
          type="text"
          required
          placeholder="10-1"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Ciclo escolar</label>
          <input
            name="ciclo_escolar"
            type="number"
            required
            defaultValue={CICLO_ACTUAL}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Nota mínima</label>
          <input
            name="nota_minima"
            type="number"
            required
            defaultValue={70}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      {existingSections.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Clonar estructura desde (opcional)
          </label>
          <select
            name="clonar_de"
            defaultValue=""
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          >
            <option value="">No clonar, empezar en blanco</option>
            {existingSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.institutionNombre} · {s.asignatura} — {s.nombre} ({s.ciclo_escolar})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-400">
            Copia la distribución de rubros, indicadores, pruebas, tareas y etapas de proyecto de
            esa sección. No copia estudiantes, notas ni fechas de asistencia.
          </p>
        </div>
      )}

      <p className="text-xs text-zinc-400">
        La distribución de rubros (Cotidiano, Tareas, Asistencia, Proyecto, Pruebas) se crea con
        valores por defecto y se ajusta luego en Ajustes.
      </p>

      <button
        type="submit"
        className="mt-2 w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
      >
        Crear sección
      </button>
    </form>
  );
}
