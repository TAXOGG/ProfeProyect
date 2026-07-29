import Link from "next/link";
import { createInstrument } from "@/lib/actions/instruments";
import { TIPO_LABEL } from "@/lib/instrument-labels";
import { HelpTooltip } from "@/components/help-tooltip";

export default function NuevoInstrumentoPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-8 sm:py-10">
      <Link href="/instrumentos" className="text-xs font-medium text-zinc-500 hover:text-zinc-800">
        ← Volver a Instrumentos
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Nuevo instrumento</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Después de crearlo vas a poder agregar los criterios y niveles (según el tipo que elijas).
      </p>

      <form action={createInstrument} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Nombre</label>
          <input
            name="nombre"
            type="text"
            required
            placeholder="Ej: Rúbrica de ensayo argumentativo"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-zinc-700">
            Tipo de instrumento
            <HelpTooltip
              text={
                "Rúbrica analítica: califica varios criterios por separado, cada uno con sus propios niveles (ej. Contenido, Ortografía, Presentación).\n\n" +
                "Rúbrica holística: un solo puntaje general de desempeño, sin separar por criterio.\n\n" +
                "Lista de cotejo: por cada criterio solo marcás si Cumple o No cumple.\n\n" +
                "Escala de valoración: por cada criterio elegís un nivel de frecuencia o calidad (ej. Siempre / A veces / Nunca).\n\n" +
                "Registro anecdótico: no genera nota — solo un espacio para anotar lo observado."
              }
            />
          </label>
          <select
            name="tipo"
            required
            defaultValue=""
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Selecciona un tipo
            </option>
            {Object.entries(TIPO_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-400">
            No se puede cambiar después de creado — si te equivocás, duplicá el instrumento con el
            tipo correcto.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Materia (opcional)</label>
            <input
              name="materia"
              type="text"
              placeholder="Español"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Nivel (opcional)</label>
            <input
              name="nivel"
              type="text"
              placeholder="Décimo"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Descripción (opcional)</label>
          <textarea
            name="descripcion"
            rows={2}
            placeholder="Para qué actividad sirve este instrumento"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400"
          />
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Crear instrumento
        </button>
      </form>
    </div>
  );
}
