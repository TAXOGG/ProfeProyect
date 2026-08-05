"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updateStudent } from "@/lib/actions/students";
import type { Student } from "@/lib/types";
import { ADECUACION_OPCIONES } from "@/lib/adecuacion";

export function StudentEditModal({
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
      aria-labelledby="student-edit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="student-edit-modal-title" className="text-sm font-semibold text-zinc-900">
          Editar estudiante
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Corrige datos que se cargaron mal o que cambiaron durante el periodo.
        </p>

        <form
          ref={formRef}
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
          action={(formData) => {
            setError(null);
            const primerApellido = String(formData.get("primer_apellido") ?? "").trim();
            const nombre = String(formData.get("nombre") ?? "").trim();
            if (!primerApellido || !nombre) {
              setError("Primer apellido y nombre son obligatorios.");
              return;
            }
            startTransition(async () => {
              await updateStudent(sectionId, student.id, formData);
              onClose();
            });
          }}
        >
          <div>
            <label className="block text-xs font-medium text-zinc-700">1er apellido</label>
            <input
              name="primer_apellido"
              required
              defaultValue={student.primer_apellido}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700">2do apellido</label>
            <input
              name="segundo_apellido"
              defaultValue={student.segundo_apellido ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-700">Nombre</label>
            <input
              name="nombre"
              required
              defaultValue={student.nombre}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700">Identificación</label>
            <input
              name="identificacion"
              defaultValue={student.identificacion ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700">Sexo</label>
            <select
              name="sexo"
              defaultValue={student.sexo ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">—</option>
              <option value="H">Hombre</option>
              <option value="M">Mujer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700">Tipo de Adecuación</label>
            <select
              name="adecuacion"
              defaultValue={student.adecuacion}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              {ADECUACION_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700">
              Tipo de apoyo (detalle libre)
            </label>
            <input
              name="tipo_apoyo"
              defaultValue={student.tipo_apoyo ?? "No tiene"}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

          <div className="mt-1 flex justify-end gap-2 sm:col-span-2">
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
