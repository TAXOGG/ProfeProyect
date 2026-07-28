"use client";

import { useState, useTransition } from "react";
import { restoreStudent, purgeStudent } from "@/lib/actions/students";
import { ConfirmModal } from "@/components/confirm-modal";
import type { Student } from "@/lib/types";

export function PapeleraEstudiantesList({
  sectionId,
  students,
}: {
  sectionId: string;
  students: Student[];
}) {
  const [isPending, startTransition] = useTransition();
  const [purging, setPurging] = useState<Student | null>(null);

  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-2">Nombre completo</th>
            <th className="px-4 py-2">Identificación</th>
            <th className="px-4 py-2">Eliminado</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {students.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-2 font-medium text-zinc-900">
                {s.primer_apellido} {s.segundo_apellido} {s.nombre}
              </td>
              <td className="px-4 py-2 text-zinc-500">{s.identificacion ?? "—"}</td>
              <td className="px-4 py-2 whitespace-nowrap text-zinc-500">
                {s.deleted_at ? new Date(s.deleted_at).toLocaleString("es-CR") : "—"}
              </td>
              <td className="px-4 py-2 text-right">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => startTransition(() => restoreStudent(sectionId, s.id))}
                  className="mr-3 text-xs font-medium text-teal-700 hover:underline disabled:opacity-50"
                >
                  Restaurar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setPurging(s)}
                  className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                >
                  Eliminar permanentemente
                </button>
              </td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                La papelera está vacía.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <ConfirmModal
        open={!!purging}
        tone="danger"
        title="Eliminar permanentemente"
        description={
          purging
            ? `"${purging.primer_apellido} ${purging.segundo_apellido ?? ""} ${purging.nombre}" y todas sus notas asociadas se van a borrar para siempre. Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar para siempre"
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (purging) startTransition(() => purgeStudent(sectionId, purging.id));
          setPurging(null);
        }}
        onCancel={() => setPurging(null)}
      />
    </div>
  );
}
