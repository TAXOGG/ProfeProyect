"use client";

import { useState, useTransition } from "react";
import { deleteStudentPhoto } from "@/lib/actions/student-photos";
import { categoriaLabel } from "@/lib/photo-categories";
import { ConfirmModal } from "@/components/confirm-modal";
import type { StudentPhoto } from "@/lib/types";

type PhotoWithUrl = StudentPhoto & { url: string | null };

export function PhotoGallery({
  sectionId,
  studentId,
  photos,
}: {
  sectionId: string;
  studentId: string;
  photos: PhotoWithUrl[];
}) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleting = photos.find((p) => p.id === deletingId);

  if (photos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-5 py-10 text-center text-sm text-zinc-400">
        Aún no hay fotos guardadas para este estudiante.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {photos.map((p) => (
        <div key={p.id} className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="flex aspect-square items-center justify-center bg-zinc-100">
            {p.url ? (
              <img src={p.url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="px-2 text-center text-xs text-zinc-400">
                No se pudo cargar la imagen
              </span>
            )}
          </div>
          <div className="p-2">
            <p className="truncate text-xs font-medium text-zinc-700">
              {categoriaLabel(p.categoria)}
            </p>
            {p.nota && <p className="mt-0.5 truncate text-xs text-zinc-500" title={p.nota}>{p.nota}</p>}
            <p className="mt-0.5 text-[10px] text-zinc-400">
              {new Date(p.created_at).toLocaleDateString("es-CR")}
            </p>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setDeletingId(p.id)}
              className="mt-1 text-xs text-red-500 hover:text-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}

      <ConfirmModal
        open={!!deleting}
        tone="danger"
        title="Eliminar foto"
        description="Esta foto se borrará permanentemente. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          const photo = deleting;
          setDeletingId(null);
          if (!photo) return;
          startTransition(() =>
            deleteStudentPhoto(sectionId, studentId, photo.id, photo.storage_path),
          );
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
