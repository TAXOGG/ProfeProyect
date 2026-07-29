"use client";

import { useMemo, useState } from "react";
import { resolveObservationText } from "@/lib/observation-variables";
import { STARTER_TEXT, TIPO_LABEL, MEDIO_LABEL } from "@/lib/communication-labels";
import { ObservationPicker } from "@/components/observation-picker";
import type {
  ComunicacionMedio,
  ComunicacionTipo,
  CommunicationTemplate,
  ObservationTemplate,
  Student,
} from "@/lib/types";

type StudentOption = Pick<Student, "id" | "primer_apellido" | "segundo_apellido" | "nombre" | "contacto_correo">;

function studentName(s: StudentOption) {
  return `${s.primer_apellido} ${s.segundo_apellido ?? ""} ${s.nombre}`.replace(/\s+/g, " ").trim();
}

const TIPOS = Object.keys(TIPO_LABEL) as ComunicacionTipo[];
const MEDIOS = Object.keys(MEDIO_LABEL) as ComunicacionMedio[];

export function ComunicacionForm({
  action,
  students,
  observations,
  communicationTemplates,
  sectionLabel,
  periodoLabel,
  initial,
  submitLabel,
  lockStudent,
}: {
  action: (formData: FormData) => void;
  students: StudentOption[];
  observations: ObservationTemplate[];
  communicationTemplates?: CommunicationTemplate[];
  sectionLabel: string;
  periodoLabel?: string;
  initial?: {
    studentId?: string;
    tipo?: ComunicacionTipo;
    medio?: ComunicacionMedio;
    destinatario?: string;
    mensaje?: string;
    adjuntaInforme?: boolean;
  };
  submitLabel: string;
  lockStudent?: boolean;
}) {
  const [studentId, setStudentId] = useState(initial?.studentId ?? students[0]?.id ?? "");
  const [tipo, setTipo] = useState<ComunicacionTipo>(initial?.tipo ?? "progreso");
  const [medio, setMedio] = useState<ComunicacionMedio>(initial?.medio ?? "correo");
  const [destinatario, setDestinatario] = useState(initial?.destinatario ?? "");
  const [mensaje, setMensaje] = useState(initial?.mensaje ?? "");
  const [adjuntaInforme, setAdjuntaInforme] = useState(initial?.adjuntaInforme ?? false);
  const [templateNotice, setTemplateNotice] = useState<string | null>(null);

  const student = useMemo(() => students.find((s) => s.id === studentId), [students, studentId]);
  const insertableTemplates = useMemo(
    () => [...observations, ...(communicationTemplates ?? [])],
    [observations, communicationTemplates],
  );

  function useStarterTemplate() {
    const { resolved, missing } = resolveObservationText(STARTER_TEXT[tipo], {
      nombre_estudiante: student ? studentName(student) : undefined,
      grupo: sectionLabel,
      materia: sectionLabel,
      periodo: periodoLabel,
    });
    setMensaje(resolved);
    setTemplateNotice(
      missing.length > 0
        ? `No se pudo completar: ${missing.map((m) => `{{${m}}}`).join(", ")}`
        : null,
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700">Estudiante</label>
        {lockStudent ? (
          <p className="mt-1 text-sm text-zinc-800">{student ? studentName(student) : "—"}</p>
        ) : (
          <select
            value={studentId}
            onChange={(e) => {
              setStudentId(e.target.value);
              const s = students.find((st) => st.id === e.target.value);
              if (medio === "correo") setDestinatario(s?.contacto_correo ?? "");
            }}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {studentName(s)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as ComunicacionTipo)}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {TIPO_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Medio</label>
          <select
            value={medio}
            onChange={(e) => {
              const next = e.target.value as ComunicacionMedio;
              setMedio(next);
              if (next === "correo" && !destinatario) setDestinatario(student?.contacto_correo ?? "");
            }}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            {MEDIOS.map((m) => (
              <option key={m} value={m}>
                {MEDIO_LABEL[m]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Destinatario {medio === "correo" ? "(correo)" : "(opcional)"}
        </label>
        <input
          value={destinatario}
          onChange={(e) => setDestinatario(e.target.value)}
          placeholder={medio === "correo" ? "correo@ejemplo.com" : "Nombre de quien recibe"}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400"
        />
        {medio === "correo" && !destinatario && (
          <p className="mt-1 text-xs text-amber-600">
            Este estudiante no tiene correo de contacto — completalo aquí o en Estudiantes.
          </p>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="block text-sm font-medium text-zinc-700">Mensaje</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={useStarterTemplate}
              className="text-xs font-medium text-teal-700 hover:underline"
            >
              Usar plantilla inicial
            </button>
            <ObservationPicker
              observations={insertableTemplates}
              context={{
                nombre_estudiante: student ? studentName(student) : undefined,
                grupo: sectionLabel,
                materia: sectionLabel,
                periodo: periodoLabel,
              }}
              onInsert={(text) => setMensaje((prev) => (prev ? `${prev} ${text}` : text))}
            />
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(mensaje)}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
            >
              Copiar texto
            </button>
          </div>
        </div>
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          required
          rows={6}
          placeholder="Redactá el mensaje para la familia"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400"
        />
        {templateNotice && <p className="mt-1 text-xs text-amber-600">{templateNotice}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={adjuntaInforme}
          onChange={(e) => setAdjuntaInforme(e.target.checked)}
          className="rounded"
        />
        Adjuntar el informe integral del estudiante
      </label>

      <form action={action} className="contents">
        <input type="hidden" name="student_id" value={studentId} />
        <input type="hidden" name="tipo" value={tipo} />
        <input type="hidden" name="medio" value={medio} />
        <input type="hidden" name="destinatario" value={destinatario} />
        <input type="hidden" name="mensaje" value={mensaje} />
        <input type="hidden" name="adjunta_informe" value={adjuntaInforme ? "on" : "off"} />
        <button
          type="submit"
          className="mt-1 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          {submitLabel}
        </button>
      </form>
    </div>
  );
}
