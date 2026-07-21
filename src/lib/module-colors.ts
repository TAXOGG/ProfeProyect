/**
 * Color de acento por rubro/módulo — para que el docente distinga de un
 * vistazo en el menú lateral, en Reportes, y en el fondo del encabezado de
 * cada pantalla. El verde-hoja (#6FA83D) es un acento de marca heredado;
 * el resto son tonos de la paleta de Tailwind elegidos para no chocar con
 * los colores que ya tienen un significado en la app (ámbar = advertencia,
 * rojo = eliminar/peligro). Los fondos de encabezado (`headerBg`) usan
 * siempre el tono más claro de cada color para no perder legibilidad.
 * `cellBg` es la misma idea pero más desvanecida (con transparencia), para
 * pintar de fondo las celdas de datos de una columna/rubro sin competir con
 * los números — pensado para tablas como Reportes o las grillas de notas.
 */
export const MODULE_COLORS: Record<
  string,
  { dot: string; text: string; headerBg: string; headerBorder: string; cellBg: string }
> = {
  estudiantes: {
    dot: "bg-zinc-400",
    text: "text-zinc-600",
    headerBg: "bg-zinc-50",
    headerBorder: "border-zinc-200",
    cellBg: "bg-zinc-50/60",
  },
  cotidiano: {
    dot: "bg-teal-600",
    text: "text-teal-700",
    headerBg: "bg-teal-50",
    headerBorder: "border-teal-200",
    cellBg: "bg-teal-50/50",
  },
  pruebas: {
    dot: "bg-[#6FA83D]",
    text: "text-[#5c8f31]",
    headerBg: "bg-[#f2f7ec]",
    headerBorder: "border-[#d3e6bd]",
    cellBg: "bg-[#f2f7ec]/60",
  },
  tareas: {
    dot: "bg-sky-500",
    text: "text-sky-600",
    headerBg: "bg-sky-50",
    headerBorder: "border-sky-200",
    cellBg: "bg-sky-50/50",
  },
  proyecto: {
    dot: "bg-violet-500",
    text: "text-violet-600",
    headerBg: "bg-violet-50",
    headerBorder: "border-violet-200",
    cellBg: "bg-violet-50/50",
  },
  asistencia: {
    dot: "bg-orange-500",
    text: "text-orange-600",
    headerBg: "bg-orange-50",
    headerBorder: "border-orange-200",
    cellBg: "bg-orange-50/50",
  },
  reportes: {
    dot: "bg-zinc-400",
    text: "text-zinc-600",
    headerBg: "bg-teal-50",
    headerBorder: "border-teal-200",
    cellBg: "bg-teal-50/50",
  },
  ajustes: {
    dot: "bg-zinc-400",
    text: "text-zinc-600",
    headerBg: "bg-zinc-50",
    headerBorder: "border-zinc-200",
    cellBg: "bg-zinc-50/60",
  },
};

export function moduleColor(slug: string) {
  return MODULE_COLORS[slug] ?? MODULE_COLORS.ajustes;
}
