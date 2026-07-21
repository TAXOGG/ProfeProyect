"use client";

import { useState, useTransition } from "react";
import { updateStudentEstado, deleteStudent } from "@/lib/actions/students";
import { ConfirmModal } from "@/components/confirm-modal";

const ESTADOS = ["activo", "trasladado", "salido"] as const;

export function StudentRowActions({
  sectionId,
  studentId,
  estado,
}: {
  sectionId: string;
  studentId: string;
  estado: (typeof ESTADOS)[number];
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={estado}
        disabled={isPending}
        onChange={(e) =>
          startTransition(() =>
            updateStudentEstado(sectionId, studentId, e.target.value as typeof estado),
          )
        }
        className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
      >
        {ESTADOS.map((e) => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setConfirmingDelete(true)}
        className="text-xs text-red-500 hover:text-red-700"
      >
        Eliminar
      </button>

      <ConfirmModal
        open={confirmingDelete}
        tone="danger"
        title="Eliminar estudiante"
        description="Esta acción no se puede deshacer. Se perderán también sus notas registradas en esta sección."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          setConfirmingDelete(false);
          startTransition(() => deleteStudent(sectionId, studentId));
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
