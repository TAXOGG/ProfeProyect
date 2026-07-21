export type AsistenciaMetodo = "lineal" | "mep";

/**
 * Tabla oficial del MEP (Reglamento de Evaluación de los Aprendizajes,
 * Artículo 37°): asigna la nota de asistencia por TRAMOS de % de ausencias
 * injustificadas del total de lecciones impartidas, en vez de una reducción
 * continua. El reglamento asigna puntos directos (5/4/3/2/1/0) asumiendo un
 * peso de Asistencia del 5% — acá se normalizan a una escala de 0-100 para
 * que el resultado sea el mismo sin importar qué % le asigne la sección a
 * Asistencia en Ajustes (100 * 0.05 = 5, 80 * 0.05 = 4, etc.)
 */
const MEP_TRAMOS: { menorQue: number; nota: number }[] = [
  { menorQue: 10, nota: 100 },
  { menorQue: 20, nota: 80 },
  { menorQue: 30, nota: 60 },
  { menorQue: 40, nota: 40 },
  { menorQue: 50, nota: 20 },
  { menorQue: Infinity, nota: 0 },
];

export function calcularNotaAsistencia(ausenciasPct: number, metodo: AsistenciaMetodo): number {
  if (metodo !== "mep") {
    return Math.max(0, 100 - ausenciasPct);
  }
  const tramo = MEP_TRAMOS.find((t) => ausenciasPct < t.menorQue);
  return tramo?.nota ?? 0;
}
