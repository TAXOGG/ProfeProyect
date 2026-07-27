import { requireAdmin } from "@/lib/actions/admin-users";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminUserRow = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string | null;
  institutionName: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
};

export default async function AdminUsuariosPage() {
  await requireAdmin();
  const adminClient = createAdminClient();

  const [{ data: authData, error: authError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      adminClient.auth.admin.listUsers({ perPage: 1000 }),
      adminClient.from("profiles").select("id, full_name, role, institutions ( nombre )"),
    ]);

  if (authError || profilesError) {
    throw new Error(
      authError?.message ?? profilesError?.message ?? "No se pudo cargar la lista de usuarios.",
    );
  }

  const profileById = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      {
        fullName: p.full_name as string | null,
        role: p.role as string | null,
        institutionName:
          (p.institutions as unknown as { nombre: string } | null)?.nombre ?? null,
      },
    ]),
  );

  const rows: AdminUserRow[] = (authData?.users ?? [])
    .map((u) => {
      const profile = profileById.get(u.id);
      return {
        id: u.id,
        email: u.email ?? null,
        fullName: profile?.fullName ?? null,
        role: profile?.role ?? null,
        institutionName: profile?.institutionName ?? null,
        createdAt: u.created_at ?? null,
        lastSignInAt: u.last_sign_in_at ?? null,
      };
    })
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Usuarios</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {rows.length} cuenta{rows.length === 1 ? "" : "s"} registrada{rows.length === 1 ? "" : "s"}.
      </p>

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
                <td className="px-4 py-2 font-medium text-zinc-900">{r.fullName || "—"}</td>
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
    </div>
  );
}
