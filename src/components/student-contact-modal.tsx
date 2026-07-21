"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updateStudentContacto } from "@/lib/actions/students";
import type { Student } from "@/lib/types";

export function StudentContactModal({
  sectionId,
  student,
  open,
  onClose,
}: {
  sectionId: string;
  student: Student;
  open: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-contact-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="student-contact-modal-title" className="text-sm font-semibold text-zinc-900">
          Contacto de {student.primer_apellido} {student.nombre}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Datos del padre, madre o representante — se usan para enviarle el certificado de notas.
        </p>

        <form
          ref={formRef}
          className="mt-4 flex flex-col gap-3"
          action={(formData) => {
            setError(null);
            const correo = String(formData.get("contacto_correo") ?? "").trim();
            if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
              setError("El correo no parece válido.");
              return;
            }
            startTransition(async () => {
              await updateStudentContacto(sectionId, student.id, formData);
              onClose();
            });
          }}
        >
          <div>
            <label className="block text-xs font-medium text-zinc-700">
              Nombre del padre/madre/representante
            </label>
            <input
              name="contacto_nombre"
              defaultValue={student.contacto_nombre ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700">Parentesco</label>
            <input
              name="contacto_parentesco"
              placeholder="Madre, padre, tío..."
              defaultValue={student.contacto_parentesco ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700">Correo de contacto</label>
            <input
              type="email"
              name="contacto_correo"
              placeholder="correo@ejemplo.com"
              defaultValue={student.contacto_correo ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400"
            />
            <p className="mt-1 text-xs text-zinc-400">
              A este correo se enviará el certificado de notas cuando lo generes desde Reportes.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
