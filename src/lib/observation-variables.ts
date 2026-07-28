// Variables que se pueden usar dentro de una observación guardada, del
// estilo {{nombre_estudiante}}. Se resuelven al insertar la observación en
// un formulario — si falta algún dato del contexto (ej. no hay periodo),
// no se inserta nada con la etiqueta sin resolver, se avisa qué faltó.
export const OBSERVATION_VARIABLES = [
  "nombre_estudiante",
  "grupo",
  "materia",
  "periodo",
  "promedio",
  "asistencia",
] as const;

export type ObservationVariable = (typeof OBSERVATION_VARIABLES)[number];
export type ObservationContext = Partial<Record<ObservationVariable, string>>;

const VARIABLE_RE = /\{\{\s*([a-z_]+)\s*\}\}/gi;

export function extractVariables(texto: string): string[] {
  const found = new Set<string>();
  for (const match of texto.matchAll(VARIABLE_RE)) {
    found.add(match[1].toLowerCase());
  }
  return [...found];
}

export function resolveObservationText(
  texto: string,
  context: ObservationContext,
): { resolved: string; missing: string[] } {
  const missing: string[] = [];
  const resolved = texto.replace(VARIABLE_RE, (_match, rawName: string) => {
    const name = rawName.toLowerCase() as ObservationVariable;
    const value = context[name];
    if (value === undefined || value === null || value === "") {
      if (!missing.includes(name)) missing.push(name);
      return `{{${rawName}}}`;
    }
    return value;
  });
  return { resolved, missing };
}
