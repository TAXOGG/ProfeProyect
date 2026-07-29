"use client";

import { useState, useTransition } from "react";
import {
  deleteStudentPhoto,
  restoreStudentPhoto,
  purgeStudentPhoto,
} from "@/lib/actions/student-photos";
import { categoriaLabel } from "@/lib/photo-categories";
import { ConfirmModal } from "@/components/confirm-modal";
import type { StudentPhoto } from "@/lib/types";

type PhotoWithUrl = StudentPhoto & { url: string | null };

function EvidenceThumb({ p }: { p: PhotoWithUrl }) {
  if (p.file_type === "pdf") {
    return (
      <a
        href={p.url ?? undefined}
        target="_blank"
        rel="noreferrer"
        className="flex aspect-square flex-col items-center justify-center gap-1 bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
      >
        <span className="text-2xl">📄</span>
        <span className="px-2 text-center text-[10px] leading-tight">
          {p.url ? "Ver PDF" : "No disponible"}
        </span>
      </a>
    );
  }
  return (
    <div className="flex aspect-square items-center justify-center bg-zinc-100">
      {p.url ? (
        <a href={p.url} target="_blank" rel="noreferrer" className="h-full w-full">
          <img src={p.url} alt="" className="h-full w-full object-cover" />
        </a>
      ) : (
        <span className="px-2 text-center text-xs text-zinc-400">No se pudo cargar la imagen</span>
      )}
    </div>
  );
}

export function PhotoGallery({
  sectionId,
  studentId,
  photos,
  deletedPhotos,
}: {
  sectionId: string;
  studentId: string;
  photos: PhotoWithUrl[];
  deletedPhotos?: PhotoWithUrl[];
}) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [purgingId, setPurgingId] = useState<string | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const deleting = photos.find((p) => p.id === deletingId);
  const purging = (deletedPhotos ?? []).find((p) => p.id === purgingId);

  return (
    <div>
      {photos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 px-5 py-10 text-center text-sm text-zinc-400">
          Aún no hay evidencia guardada para este estudiante.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <EvidenceThumb p={p} />
              <div className="p-2">
                <p className="truncate text-xs font-medium text-zinc-700">
                  {categoriaLabel(p.categoria)}
                </p>
                {p.nota && (
                  <p className="mt-0.5 truncate text-xs text-zinc-500" title={p.nota}>
                    {p.nota}
                  </p>
                )}
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
        </div>
      )}

      {deletedPhotos && deletedPhotos.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setTrashOpen((v) => !v)}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
          >
            {trashOpen ? "▾" : "▸"} Papelera ({deletedPhotos.length})
          </button>
          {trashOpen && (
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {deletedPhotos.map((p) => (
                <div
                  key={p.id}
                  className="overflow-hidden rounded-lg border border-zinc-200 bg-white opacity-70"
                >
                  <EvidenceThumb p={p} />
                  <div className="p-2">
                    <p className="truncate text-xs font-medium text-zinc-700">
                      {categoriaLabel(p.categoria)}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(() => restoreStudentPhoto(sectionId, studentId, p.id))
                        }
                        className="text-xs text-teal-700 hover:underline"
                      >
                        Restaurar
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setPurgingId(p.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Eliminar definitivo
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={!!deleting}
        tone="danger"
        title="Eliminar evidencia"
        description="Se mueve a la papelera — se puede restaurar después."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          const photo = deleting;
          setDeletingId(null);
          if (!photo) return;
          startTransition(() => deleteStudentPhoto(sectionId, studentId, photo.id));
        }}
        onCancel={() => setDeletingId(null)}
      />

      <ConfirmModal
        open={!!purging}
        tone="danger"
        title="Eliminar definitivamente"
        description="Esta evidencia se borrará para siempre, incluyendo el archivo. Esta acción no se puede deshacer."
        confirmLabel="Eliminar definitivo"
        cancelLabel="Cancelar"
        onConfirm={() => {
          const photo = purging;
          setPurgingId(null);
          if (!photo) return;
          startTransition(() =>
            purgeStudentPhoto(sectionId, studentId, photo.id, photo.storage_path),
          );
        }}
        onCancel={() => setPurgingId(null)}
      />
    </div>
  );
}
