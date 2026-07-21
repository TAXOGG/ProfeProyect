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
    return <span className="text-xs font-medium text-emerald-600">✓ enviado</span>;
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setErrorMsg(null);
          startTransition(async () => {
            const result = await sendCertificadoNotas(sectionId, studentId);
            if (result.success) {
              setStatus("sent");
            } else {
              setStatus("error");
              setErrorMsg(result.error ?? "No se pudo enviar.");
            }
          });
        }}
        className="text-xs font-medium text-teal-700 hover:underline disabled:opacity-50"
      >
        {isPending ? "Enviando..." : "Enviar por correo"}
      </button>
      {status === "error" && errorMsg && (
        <span className="max-w-[9rem] text-[10px] leading-tight text-red-600">{errorMsg}</span>
      )}
    </div>
  );
}
