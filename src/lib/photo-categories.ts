export const PHOTO_CATEGORIAS: { value: string; label: string }[] = [
  { value: "", label: "General / sin categoría" },
  { value: "cotidiano", label: "Trabajo Cotidiano" },
  { value: "tareas", label: "Tareas" },
  { value: "proyecto", label: "Proyecto" },
  { value: "pruebas", label: "Pruebas" },
  { value: "asistencia", label: "Asistencia" },
  { value: "incidente", label: "Incidente / seguimiento" },
];

export function categoriaLabel(value: string | null) {
  return PHOTO_CATEGORIAS.find((c) => c.value === (value ?? ""))?.label ?? value ?? "General";
}
