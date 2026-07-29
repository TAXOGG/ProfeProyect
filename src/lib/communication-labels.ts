import type { ComunicacionEstado, ComunicacionMedio, ComunicacionTipo } from "@/lib/types";

export const TIPO_LABEL: Record<ComunicacionTipo, string> = {
  progreso: "Informe de progreso",
  ausencia: "Aviso de ausencia",
  trabajo_pendiente: "Aviso de trabajo pendiente",
  convocatoria: "Convocatoria",
  reconocimiento: "Reconocimiento",
  seguimiento: "Seguimiento académico",
  personalizada: "Comunicación personalizada",
};

export const MEDIO_LABEL: Record<ComunicacionMedio, string> = {
  correo: "Correo electrónico",
  llamada: "Llamada",
  reunion: "Reunión",
  mensajeria: "Mensajería",
  impresa: "Comunicación impresa",
  otro: "Otro",
};

export const ESTADO_LABEL: Record<ComunicacionEstado, string> = {
  preparada: "Preparada",
  enviada: "Enviada",
  registrada_manualmente: "Registrada manualmente",
};

export const ESTADO_BADGE: Record<ComunicacionEstado, string> = {
  preparada: "bg-zinc-100 text-zinc-600",
  enviada: "bg-emerald-100 text-emerald-700",
  registrada_manualmente: "bg-sky-100 text-sky-700",
};

// Solo "correo" puede confirmarse técnicamente (vía Resend) — para el resto
// de medios ARCE no tiene forma de saber si la comunicación de verdad
// ocurrió, así que el docente la registra manualmente.
export function medioConfirmable(medio: ComunicacionMedio) {
  return medio === "correo";
}

// Mensaje inicial por tipo, con variables {{}} que se resuelven igual que
// las observaciones reutilizables (misma sintaxis, mismo motor de
// resolución) — evita construir un segundo sistema de plantillas para esto.
export const STARTER_TEXT: Record<ComunicacionTipo, string> = {
  progreso:
    "Estimada familia, les comparto un informe del progreso de {{nombre_estudiante}} en {{materia}} durante {{periodo}}.",
  ausencia:
    "Estimada familia, les informo que {{nombre_estudiante}} registra ausencias en {{materia}} durante {{periodo}} que me gustaría conversar con ustedes.",
  trabajo_pendiente:
    "Estimada familia, {{nombre_estudiante}} tiene trabajo pendiente de entregar en {{materia}}. Les agradezco dar seguimiento en casa.",
  convocatoria:
    "Estimada familia, les convoco a una reunión para conversar sobre el desempeño de {{nombre_estudiante}} en {{materia}}.",
  reconocimiento:
    "Estimada familia, quiero reconocer el desempeño de {{nombre_estudiante}} en {{materia}} durante {{periodo}}. ¡Felicidades!",
  seguimiento:
    "Estimada familia, les escribo para dar seguimiento académico a {{nombre_estudiante}} en {{materia}}.",
  personalizada: "",
};
