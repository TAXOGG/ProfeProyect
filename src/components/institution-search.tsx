"use client";

import { useRef, useState, useTransition } from "react";
import { searchInstitutions, type InstitutionSearchResult } from "@/lib/actions/institutions";
import { HelpTooltip } from "@/components/help-tooltip";

export function InstitutionSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InstitutionSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<InstitutionSearchResult | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [nombrePrefill, setNombrePrefill] = useState("");
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelected(null);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const found = await searchInstitutions(value);
        setResults(found);
      });
    }, 250);
  }

  function pick(result: InstitutionSearchResult) {
    setSelected(result);
    setQuery(result.canton ? `${result.nombre} — ${result.canton}` : result.nombre);
    setOpen(false);
  }

  function pickNew(prefill?: string) {
    setNombrePrefill(prefill ?? query.trim());
    setCreatingNew(true);
    setSelected(null);
    setOpen(false);
  }

  if (creatingNew) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-zinc-700">Institución nueva</label>
          <button
            type="button"
            onClick={() => {
              setCreatingNew(false);
              setQuery("");
            }}
            className="text-xs text-zinc-500 underline hover:text-zinc-800"
          >
            Buscar una existente
          </button>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          El catálogo viene de un listado oficial del MEP de 2019 — si tu institución es más nueva
          o cambió de nombre, complétala aquí. Va a quedar disponible para otros docentes también.
        </p>
        <div className="mt-2 grid grid-cols-1 gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-600">
              Nombre de la institución
            </label>
            <input
              name="institucion_nombre"
              type="text"
              required
              defaultValue={nombrePrefill}
              placeholder="Liceo de Desamparados"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Provincia</label>
            <input
              name="provincia"
              type="text"
              placeholder="SAN JOSE"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Cantón</label>
            <input
              name="canton"
              type="text"
              placeholder="SANTA ANA"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Dirección Regional</label>
            <input
              name="direccion_regional"
              type="text"
              placeholder="SAN JOSE OESTE"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Circuito</label>
            <input
              name="circuito"
              type="text"
              placeholder="04"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="flex items-center text-sm font-medium text-zinc-700">
        Institución
        <HelpTooltip text="Escribe al menos 3 letras del nombre de tu colegio o escuela para buscarlo (por ejemplo: 'santa ana'). Te van a aparecer todas las opciones que coincidan, con el cantón al lado para que elijas la correcta. Si no la encuentras, más abajo hay un botón para agregarla tú mismo." />
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        required={!selected}
        placeholder="Escribe el nombre del colegio o escuela..."
        autoComplete="off"
        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
      />
      {selected && <input type="hidden" name="institucion_id" value={selected.id} />}

      {open && (
        <div className="absolute z-10 mt-1 max-h-80 w-full overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-lg">
          {query.trim().length < 3 && (
            <p className="px-3 py-2 text-xs text-zinc-400">
              Escribe al menos 3 letras para buscar entre las instituciones del MEP.
            </p>
          )}
          {query.trim().length >= 3 && isPending && (
            <p className="px-3 py-2 text-xs text-zinc-400">Buscando...</p>
          )}
          {query.trim().length >= 3 && !isPending && results.length === 0 && (
            <div className="px-3 py-3">
              <p className="text-sm text-zinc-700">
                No encontramos &ldquo;{query.trim()}&rdquo; en el catálogo.
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                El catálogo del MEP es de 2019 — puede que tu institución sea más reciente o el
                nombre no coincida exacto.
              </p>
              <button
                type="button"
                onMouseDown={() => pickNew()}
                className="mt-2 rounded-md bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800"
              >
                + Agregar &ldquo;{query.trim()}&rdquo; como institución nueva
              </button>
            </div>
          )}
          {results.map((r) => (
            <button
              type="button"
              key={r.id}
              onMouseDown={() => pick(r)}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-50"
            >
              <span className="text-zinc-900">{r.nombre}</span>
              <span className="ml-1 text-xs text-zinc-400">
                {[r.canton, r.provincia].filter(Boolean).join(", ")}
              </span>
            </button>
          ))}
          {results.length > 0 && (
            <button
              type="button"
              onMouseDown={() => pickNew()}
              className="block w-full border-t border-zinc-100 px-3 py-2 text-left text-sm font-medium text-teal-700 hover:bg-teal-50"
            >
              + Ninguna es la mía — crear institución nueva
            </button>
          )}
        </div>
      )}

      {selected ? (
        <p className="mt-1 text-xs text-zinc-500">
          {selected.direccion_regional ? `Dirección Regional: ${selected.direccion_regional}` : ""}
          {selected.circuito ? ` · Circuito: ${selected.circuito}` : ""}
          {selected.codigo_presupuestario ? ` · Código: ${selected.codigo_presupuestario}` : ""}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => pickNew()}
          className="mt-1 text-xs text-zinc-500 underline hover:text-zinc-800"
        >
          ¿No ves tu institución? Agrégala tú
        </button>
      )}
    </div>
  );
}
