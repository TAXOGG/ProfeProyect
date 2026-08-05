"use client";

import { useState, useTransition } from "react";
import { sendInformeIntegral } from "@/lib/actions/informe";
import { PdfIntroModal } from "@/components/pdf-intro-modal";

export function SendInformeButton({
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
  const [modalOpen, setModalOpen] = useState(false);

  if (!hasEmail) {
    return (
      <span
        className="text-xs font-medium text-zinc-400"
        title="Agrega el correo de contacto en Estudiantes para poder enviarlo"
      >
        Enviar por correo (sin correo)
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

  function send(introText: string) {
    setStatus("idle");
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const result = await sendInformeIntegral(sectionId, studentId, introText || undefined);
        if (result.success) {
          setStatus("sent");
          setModalOpen(false);
        } else {
          setStatus("error");
          setErrorMsg(result.error ?? "No se pudo enviar.");
        }
      } catch (err) {
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "No se pudo enviar.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => setModalOpen(true)}
        className="rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50"
      >
        {isPending ? "Enviando..." : status === "error" ? "Reintentar" : "Enviar por correo"}
      </button>
      {status === "error" && errorMsg && (
        <span className="max-w-[16rem] rounded border border-red-200 bg-red-50 px-1.5 py-1 text-xs font-medium leading-tight text-red-700">
          No se pudo enviar: {errorMsg}
        </span>
      )}
      {modalOpen && (
        <PdfIntroModal
          title="Enviar informe integral"
          isPending={isPending}
          onConfirm={send}
          onCancel={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
