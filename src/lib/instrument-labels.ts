import type { InstrumentEstado, InstrumentTipo } from "@/lib/types";

export const TIPO_LABEL: Record<InstrumentTipo, string> = {
  rubrica_analitica: "Rúbrica analítica",
  rubrica_holistica: "Rúbrica holística",
  lista_cotejo: "Lista de cotejo",
  escala_valoracion: "Escala de valoración",
  registro_anecdotico: "Registro anecdótico",
};

export const ESTADO_LABEL: Record<InstrumentEstado, string> = {
  borrador: "Borrador",
  activo: "Activo",
  aplicado: "Aplicado",
  archivado: "Archivado",
};

export const ESTADO_BADGE: Record<InstrumentEstado, string> = {
  borrador: "bg-zinc-100 text-zinc-600",
  activo: "bg-emerald-100 text-emerald-700",
  aplicado: "bg-sky-100 text-sky-700",
  archivado: "bg-zinc-100 text-zinc-400",
};

// La rúbrica holística usa un único criterio implícito ("Desempeño
// general") para no exponer el concepto de "criterio" en su interfaz.
export function usaCriteriosVisibles(tipo: InstrumentTipo) {
  return tipo === "rubrica_analitica" || tipo === "lista_cotejo" || tipo === "escala_valoracion";
}

export function generaNota(tipo: InstrumentTipo) {
  return tipo !== "registro_anecdotico";
}
