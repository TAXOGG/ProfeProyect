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

// Regla oficial del MEP: cada N tardanzas acumuladas cuentan como 1 ausencia
// injustificada adicional. tardanzasPorAusencia null/undefined desactiva la conversión
// (comportamiento histórico, sin tocar nada para las secciones que no la configuraron).
export function ausenciasConTardanzas(
  ausenciasBase: number,
  cantidadTardanzas: number,
  tardanzasPorAusencia: number | null | undefined,
): number {
  if (!tardanzasPorAusencia || tardanzasPorAusencia < 1) return ausenciasBase;
  return ausenciasBase + Math.floor(cantidadTardanzas / tardanzasPorAusencia);
}

// Fechas en las que un estudiante tuvo una ausencia injustificada — los indicadores de
// Cotidiano aplicados esos días quedan excluidos del cálculo (ni suman en contra ni al
// total posible), en vez de contarse como 0. Usado tanto en el cálculo de notas
// (src/lib/grades.ts) como en la grilla de Cotidiano, para que muestren lo mismo.
export function fechasAusenteInjustificado(
  sessions: { id: string; fecha: string }[],
  records: { session_id: string; student_id: string; justificada: boolean; ausencias: number }[],
  studentId: string,
): Set<string> {
  const fechas = new Set<string>();
  for (const session of sessions) {
    const record = records.find(
      (r) => r.session_id === session.id && r.student_id === studentId,
    );
    if (record && !record.justificada && record.ausencias > 0) fechas.add(session.fecha);
  }
  return fechas;
}
