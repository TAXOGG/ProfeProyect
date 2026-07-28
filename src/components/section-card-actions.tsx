"use client";

import { useState, useTransition } from "react";
import { archiveSection, deleteSectionPermanently } from "@/lib/actions/sections";
import { closeAllPeriods } from "@/lib/actions/rubric";
import { ConfirmModal } from "@/components/confirm-modal";

// archiveSection hace redirect() internamente (lo usa Ajustes para salir de
// la sección recién archivada) — ese redirect lanza un error especial de
// Next que hay que dejar pasar, no tratarlo como una falla real.
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function SectionCardActions({
  sectionId,
  sectionLabel,
}: {
  sectionId: string;
  sectionLabel: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<"archivar" | "cerrar" | "eliminar" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<void>) {
    setError(null);
    setConfirming(null);
    startTransition(async () => {
      try {
        await action();
      } catch (e) {
        if (isRedirectError(e)) throw e;
        setError(e instanceof Error ? e.message : "No se pudo completar la acción.");
      }
    });
  }

  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={isPending}
        onClick={() => setConfirming("cerrar")}
        className="font-medium text-zinc-500 hover:text-amber-700 disabled:opacity-50"
      >
        Cerrar periodos
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setConfirming("archivar")}
        className="font-medium text-zinc-500 hover:text-zinc-800 disabled:opacity-50"
      >
        Archivar
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setConfirming("eliminar")}
        className="font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
      >
        Eliminar
      </button>

      {error && <p className="w-full text-red-600">{error}</p>}

      <ConfirmModal
        open={confirming === "cerrar"}
        tone="warning"
        title="Cerrar todos los periodos"
        description={`Vas a bloquear cambios en notas y asistencia de TODOS los periodos de "${sectionLabel}". Podés seguir consultando y exportando. Cada periodo se puede reabrir después por separado, desde Ajustes.`}
        confirmLabel="Cerrar periodos"
        cancelLabel="Cancelar"
        onConfirm={() => run(() => closeAllPeriods(sectionId))}
        onCancel={() => setConfirming(null)}
      />

      <ConfirmModal
        open={confirming === "archivar"}
        tone="warning"
        title="Archivar sección"
        description={`"${sectionLabel}" va a dejar de aparecer en tu inicio, pero conserva toda su información. Podés restaurarla cuando quieras desde Secciones archivadas.`}
        confirmLabel="Archivar"
        cancelLabel="Cancelar"
        onConfirm={() => run(() => archiveSection(sectionId))}
        onCancel={() => setConfirming(null)}
      />

      <ConfirmModal
        open={confirming === "eliminar"}
        tone="danger"
        title="Eliminar permanentemente"
        description={`"${sectionLabel}" y TODA su información (estudiantes, notas, asistencia, configuración) se van a borrar para siempre. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar para siempre"
        cancelLabel="Cancelar"
        onConfirm={() => run(() => deleteSectionPermanently(sectionId))}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
