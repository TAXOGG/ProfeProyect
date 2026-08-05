"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { uploadInstitutionLogo, removeInstitutionLogo } from "@/lib/actions/institution-logo";

export function InstitutionLogoCard({
  institutionId,
  nombre,
  logoUrl,
}: {
  institutionId: string;
  nombre: string;
  logoUrl: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isRemoving, startRemoving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await uploadInstitutionLogo(institutionId, formData);
        formRef.current?.reset();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo subir el logo.");
      }
    });
  }

  function handleRemove() {
    setError(null);
    startRemoving(async () => {
      try {
        await removeInstitutionLogo(institutionId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo quitar el logo.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt=""
            width={44}
            height={44}
            unoptimized
            className="h-11 w-11 shrink-0 rounded object-contain"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-zinc-100 text-xs text-zinc-400">
            Sin logo
          </div>
        )}
        <h3 className="text-sm font-semibold text-zinc-900">{nombre}</h3>
      </div>

      <form ref={formRef} action={handleSubmit} className="mt-4 flex flex-wrap items-center gap-3">
        <input
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required
          className="text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {isPending ? "Subiendo..." : logoUrl ? "Reemplazar logo" : "Subir logo"}
        </button>
        {logoUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isRemoving}
            className="text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-60"
          >
            {isRemoving ? "Quitando..." : "Quitar logo"}
          </button>
        )}
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-zinc-400">PNG, JPG o WEBP, hasta 2MB.</p>
    </div>
  );
}
