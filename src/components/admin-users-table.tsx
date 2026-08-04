"use client";

import { useState } from "react";
import { AdminUserEditModal } from "@/components/admin-user-edit-modal";

export type AdminUserRow = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string | null;
  institutionId: string | null;
  institutionName: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
};

export function AdminUsersTable({
  rows,
  currentUserId,
}: {
  rows: AdminUserRow[];
  currentUserId: string;
}) {
  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);

  return (
    <>
      <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Correo</th>
              <th className="px-4 py-2">Institución</th>
              <th className="px-4 py-2">Rol</th>
              <th className="px-4 py-2">Creado</th>
              <th className="px-4 py-2">Último acceso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">
                  <button
                    type="button"
                    onClick={() => setEditUser(r)}
                    className="text-left hover:underline"
                    title="Editar usuario"
                  >
                    {r.fullName || "—"}
                  </button>
                </td>
                <td className="px-4 py-2 text-zinc-500">{r.email ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-500">{r.institutionName ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-500">{r.role ?? "—"}</td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-500">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString("es-CR") : "—"}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-500">
                  {r.lastSignInAt ? new Date(r.lastSignInAt).toLocaleDateString("es-CR") : "Nunca"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-400">
                  No hay usuarios todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editUser && (
        <AdminUserEditModal
          user={editUser}
          currentUserId={currentUserId}
          open={!!editUser}
          onClose={() => setEditUser(null)}
        />
      )}
    </>
  );
}
