"use client";

import { useState, useTransition } from "react";
import { sendCertificadoNotas } from "@/lib/actions/certificado";

export function SendCertificateButton({
  sectionId,
  studentId,
  hasEmail,
}: {
  sectionId: string;
  studentId: string;
  hasEmail: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!hasEmail) {
    return (
      <span className="text-xs text-zinc-400" title="Agrega el correo de contacto en Estudiantes">
        sin correo
      </span>
    );
  }

  if (status === "sent") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
        ✓ Enviado
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setStatus("idle");
          setErrorMsg(null);
          startTransition(async () => {
            try {
              const result = await sendCertificadoNotas(sectionId, studentId);
              if (result.success) {
                setStatus("sent");
              } else {
                setStatus("error");
                setErrorMsg(result.error ?? "No se pudo enviar.");
              }
            } catch (err) {
              // Cubre fallos inesperados (ej. la llamada a la Server Action
              // se cae por red) que de otro modo dejarían el botón en
              // "idle" sin ninguna señal de que algo salió mal.
              setStatus("error");
              setErrorMsg(err instanceof Error ? err.message : "No se pudo enviar.");
            }
          });
        }}
        className="rounded border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50"
      >
        {isPending ? "Enviando..." : status === "error" ? "Reintentar" : "Enviar por correo"}
      </button>
      {status === "error" && errorMsg && (
        <span className="max-w-[11rem] rounded border border-red-200 bg-red-50 px-1.5 py-1 text-xs font-medium leading-tight text-red-700">
          No se pudo enviar: {errorMsg}
        </span>
      )}
    </div>
  );
}
