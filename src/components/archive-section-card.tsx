"use client";

import { useState, useTransition } from "react";
import { archiveSection } from "@/lib/actions/sections";
import { ConfirmModal } from "@/components/confirm-modal";
import { HelpTooltip } from "@/components/help-tooltip";

export function ArchiveSectionCard({ sectionId }: { sectionId: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-5">
      <h3 className="flex items-center text-sm font-semibold text-red-900">
        Zona de peligro
        <HelpTooltip text="Archivar oculta esta sección del inicio y del menú lateral, pero conserva toda la información (estudiantes, notas, asistencia) por si la necesitas después. Puedes recuperarla desde 'Secciones archivadas' en el inicio." />
      </h3>
      <p className="mt-1 text-sm text-red-700">
        Archiva esta sección cuando termines el ciclo escolar, para que no se acumule en tu lista
        de secciones activas.
      </p>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setConfirming(true)}
        className="mt-3 rounded-md border border-red-300 bg-white px-4 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
      >
        Archivar esta sección
      </button>

      <ConfirmModal
        open={confirming}
        tone="danger"
        title="Archivar sección"
        description="La sección se ocultará del inicio y del menú lateral. Toda la información se conserva y puedes recuperarla desde 'Secciones archivadas' en el inicio."
        confirmLabel="Archivar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          setConfirming(false);
          startTransition(() => archiveSection(sectionId));
        }}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
