import type { Student } from "@/lib/types";

export type Adecuacion = Student["adecuacion"];

export const ADECUACION_OPCIONES: { value: Adecuacion; label: string }[] = [
  { value: "no_presenta", label: "No presenta" },
  { value: "acceso", label: "Adecuación de acceso" },
  { value: "curricular_significativa", label: "Adecuación curricular significativa" },
  { value: "curricular_no_significativa", label: "Adecuación curricular no significativa" },
];

const LABEL_BY_VALUE = new Map(ADECUACION_OPCIONES.map((o) => [o.value, o.label]));

export function adecuacionLabel(value: Adecuacion): string {
  return LABEL_BY_VALUE.get(value) ?? value;
}

const BADGE_CLASS: Record<Adecuacion, string> = {
  no_presenta: "text-zinc-400",
  acceso: "bg-sky-50 text-sky-700 border border-sky-200",
  curricular_significativa: "bg-amber-50 text-amber-700 border border-amber-200",
  curricular_no_significativa: "bg-violet-50 text-violet-700 border border-violet-200",
};

export function adecuacionBadgeClass(value: Adecuacion): string {
  return BADGE_CLASS[value];
}
