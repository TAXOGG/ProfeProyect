"use client";

import { useRef, useState, useTransition } from "react";
import { uploadStudentPhoto, type UploadPhotoResult } from "@/lib/actions/student-photos";
import { PHOTO_CATEGORIAS } from "@/lib/photo-categories";
import { HelpTooltip } from "@/components/help-tooltip";

export function UploadPhotoForm({
  sectionId,
  studentId,
}: {
  sectionId: string;
  studentId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<UploadPhotoResult | null>(null);

  function handleSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await uploadStudentPhoto(sectionId, studentId, null, formData);
      setResult(res);
      if (res.success) formRef.current?.reset();
    });
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <h3 className="flex items-center text-sm font-semibold text-zinc-900">
        Agregar foto
        <HelpTooltip text="En el teléfono, al tocar 'Foto' se abre la cámara directamente. Solo se aceptan imágenes (JPG, PNG, HEIC, WEBP) de hasta 10MB." />
      </h3>
      <form ref={formRef} action={handleSubmit} className="mt-3 flex flex-col gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-600">Foto</label>
          <input
            name="foto"
            type="file"
            accept="image/*"
            capture="environment"
            required
            className="mt-1 w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-zinc-600">Categoría (opcional)</label>
            <select
              name="categoria"
              defaultValue=""
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm"
            >
              {PHOTO_CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-[2] min-w-[200px]">
            <label className="block text-xs font-medium text-zinc-600">Nota (opcional)</label>
            <input
              name="nota"
              type="text"
              placeholder="Ej. Guía de ejercicios cap. 3, entregada el 10 de julio"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm placeholder:text-zinc-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="self-start rounded-md bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {isPending ? "Subiendo..." : "Guardar foto"}
        </button>
      </form>

      {result?.error && <p className="mt-3 text-sm text-red-600">{result.error}</p>}
      {result?.success && <p className="mt-3 text-sm text-emerald-600">Foto guardada.</p>}
    </div>
  );
}
