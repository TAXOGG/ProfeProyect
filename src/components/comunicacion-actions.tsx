"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  registrarComunicacionRealizada,
  addObservacion,
  deleteComunicacion,
  sendComunicacionCorreo,
} from "@/lib/actions/communications";
import { ConfirmModal } from "@/components/confirm-modal";
import { medioConfirmable } from "@/lib/communication-labels";
import type { Communication } from "@/lib/types";

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function ComunicacionActions({
  sectionId,
  comunicacion,
  hasEmail,
}: {
  sectionId: string;
  comunicacion: Communication;
  hasEmail: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [showRegistrar, setShowRegistrar] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (e) {
        if (isRedirectError(e)) throw e;
        setError(e instanceof Error ? e.message : "No se pudo completar la acción.");
      }
    });
  }

  if (comunicacion.estado !== "preparada") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-zinc-900">Agregar observación</h3>
        <form
          action={(fd) => {
            run(() => addObservacion(sectionId, comunicacion.id, fd));
          }}
          className="mt-2 flex flex-col gap-2"
        >
          <textarea
            name="observacion"
            rows={2}
            placeholder="Anotá algo más sobre esta comunicación"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400"
          />
          <button
            type="submit"
            disabled={isPending}
            className="self-start rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Guardar observación
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-zinc-900">Registrar comunicación</h3>
      <p className="mt-1 text-xs text-zinc-500">
        {medioConfirmable(comunicacion.medio)
          ? "Al enviar por correo, ARCE confirma el envío y actualiza el estado automáticamente."
          : "Este medio no puede confirmarse desde ARCE — registrá manualmente cuando ya la hayas realizado."}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {medioConfirmable(comunicacion.medio) ? (
          hasEmail ? (
            sent ? (
              <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                ✓ Enviado
              </span>
            ) : (
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    const result = await sendComunicacionCorreo(sectionId, comunicacion.id);
                    if (result.success) {
                      setSent(true);
                      router.refresh();
                    } else {
                      setError(result.error ?? "No se pudo enviar.");
                    }
                  });
                }}
                className="rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50"
              >
                {isPending ? "Enviando..." : "Enviar por correo"}
              </button>
            )
          ) : (
            <span className="text-xs text-zinc-400">
              Sin correo de contacto — agregalo en Estudiantes o cambiá el destinatario.
            </span>
          )
        ) : (
          <button
            type="button"
            onClick={() => setShowRegistrar((v) => !v)}
            className="rounded-md border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
          >
            Registrar como realizada
          </button>
        )}

        <button
          type="button"
          disabled={isPending}
          onClick={() => setConfirmDelete(true)}
          className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
        >
          Eliminar borrador
        </button>
      </div>

      {showRegistrar && (
        <form
          action={(fd) => {
            run(() => registrarComunicacionRealizada(sectionId, comunicacion.id, fd));
          }}
          className="mt-3 flex flex-col gap-2 rounded-md border border-zinc-200 p-3"
        >
          <div>
            <label className="block text-xs font-medium text-zinc-600">Fecha</label>
            <input
              name="fecha_realizada"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Observación (opcional)</label>
            <textarea
              name="observacion"
              rows={2}
              placeholder="Ej: hablé con la mamá, quedamos en..."
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm placeholder:text-zinc-400"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="self-start rounded-md bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-50"
          >
            Confirmar registro
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ConfirmModal
        open={confirmDelete}
        tone="danger"
        title="Eliminar borrador"
        description="Este borrador todavía no fue registrado como realizado — se puede borrar sin dejar rastro."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          setConfirmDelete(false);
          run(() => deleteComunicacion(sectionId, comunicacion.id));
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
