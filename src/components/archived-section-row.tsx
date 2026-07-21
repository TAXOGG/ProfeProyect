"use client";

import { useState, useTransition } from "react";
import { unarchiveSection, deleteSectionPermanently } from "@/lib/actions/sections";
import { ConfirmModal } from "@/components/confirm-modal";
import type { SectionWithInstitution } from "@/lib/types";

export function ArchivedSectionRow({ section }: { section: SectionWithInstitution }) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);

  if (deleted) return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white px-5 py-4">
      <div>
        <p className="font-medium text-zinc-900">
          {section.asignatura} — {section.nombre}
        </p>
        <p className="text-sm text-zinc-500">
          {section.institutionNombre} · {section.nivel} · Ciclo {section.ciclo_escolar}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => unarchiveSection(section.id))}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
        >
          Restaurar
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setConfirmingDelete(true)}
          className="text-sm text-red-500 hover:text-red-700 disabled:opacity-60"
        >
          Eliminar para siempre
        </button>
      </div>

      <ConfirmModal
        open={confirmingDelete}
        tone="danger"
        title="Eliminar sección para siempre"
        description={`Se borrará "${section.asignatura} — ${section.nombre}" junto con todos sus estudiantes, notas y asistencia. Esta acción NO se puede deshacer.`}
        confirmLabel="Eliminar para siempre"
        cancelLabel="Cancelar"
        onConfirm={() => {
          setConfirmingDelete(false);
          startTransition(async () => {
            await deleteSectionPermanently(section.id);
            setDeleted(true);
          });
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
