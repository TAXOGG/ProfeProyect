"use client";

import { useEffect, useState, useTransition } from "react";
import {
  updateUserProfile,
  getUserDeletionImpact,
  deleteUserAccount,
  type UserDeletionImpact,
} from "@/lib/actions/admin-users";
import { InstitutionSearch } from "@/components/institution-search";
import { ConfirmModal } from "@/components/confirm-modal";
import type { AdminUserRow } from "@/components/admin-users-table";

export function AdminUserEditModal({
  user,
  currentUserId,
  open,
  onClose,
}: {
  user: AdminUserRow;
  currentUserId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [isLoadingImpact, startLoadingImpact] = useTransition();
  const [impact, setImpact] = useState<UserDeletionImpact | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, startDeleting] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const isSelf = user.id === currentUserId;

  function requestDelete() {
    setDeleteError(null);
    startLoadingImpact(async () => {
      try {
        const result = await getUserDeletionImpact(user.id);
        setImpact(result);
        setConfirmDeleteOpen(true);
      } catch (e) {
        setDeleteError(e instanceof Error ? e.message : "No se pudo revisar el impacto.");
      }
    });
  }

  function confirmDelete() {
    setConfirmDeleteOpen(false);
    startDeleting(async () => {
      try {
        await deleteUserAccount(user.id);
        onClose();
      } catch (e) {
        setDeleteError(e instanceof Error ? e.message : "No se pudo eliminar la cuenta.");
      }
    });
  }

  const impactDescription = impact
    ? `Esto elimina para siempre la cuenta de ${user.email ?? "este usuario"}${
        impact.sectionsCount > 0
          ? `, junto con ${impact.sectionsCount} sección${impact.sectionsCount === 1 ? "" : "es"} y ${impact.studentsCount} estudiante${impact.studentsCount === 1 ? "" : "s"} (notas, asistencia, apoyos, instrumentos, evidencias e informes incluidos)`
          : " — no tiene secciones a su nombre"
      }. No hay papelera para esto: es un borrado permanente, no se puede deshacer.`
    : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-user-edit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="admin-user-edit-modal-title" className="text-sm font-semibold text-zinc-900">
          Editar usuario
        </h2>
        <p className="mt-1 text-sm text-zinc-500">{user.email ?? "Sin correo"}</p>

        <form
          className="mt-4 flex flex-col gap-3"
          action={(formData) => {
            setError(null);
            const nombre = String(formData.get("nombre") ?? "").trim();
            if (!nombre) {
              setError("Falta el nombre.");
              return;
            }
            startTransition(async () => {
              try {
                await updateUserProfile(user.id, formData);
                onClose();
              } catch (e) {
                setError(e instanceof Error ? e.message : "No se pudo guardar.");
              }
            });
          }}
        >
          <div>
            <label className="block text-xs font-medium text-zinc-700">Nombre completo</label>
            <input
              name="nombre"
              required
              defaultValue={user.fullName ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700">Rol</label>
            <select
              name="role"
              defaultValue={user.role ?? "docente"}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              <option value="docente">Docente</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <InstitutionSearch
            initialInstitutionId={user.institutionId ?? undefined}
            initialInstitutionName={user.institutionName ?? undefined}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>

        <div className="mt-4 border-t border-zinc-200 pt-4">
          {isSelf ? (
            <p className="text-xs text-zinc-400">
              No podés eliminar tu propia cuenta de administrador desde acá.
            </p>
          ) : (
            <button
              type="button"
              disabled={isLoadingImpact || isDeleting}
              onClick={requestDelete}
              className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              {isLoadingImpact
                ? "Revisando..."
                : isDeleting
                  ? "Eliminando..."
                  : "Eliminar esta cuenta"}
            </button>
          )}
          {deleteError && <p className="mt-2 text-sm text-red-600">{deleteError}</p>}
        </div>
      </div>

      <ConfirmModal
        open={confirmDeleteOpen}
        tone="danger"
        title="Eliminar cuenta"
        description={impactDescription}
        confirmLabel="Eliminar para siempre"
        cancelLabel="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
