import { requireAdmin } from "@/lib/actions/admin-users";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminUsersTable, type AdminUserRow } from "@/components/admin-users-table";

export default async function AdminUsuariosPage() {
  await requireAdmin();
  const adminClient = createAdminClient();

  const [{ data: authData, error: authError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      adminClient.auth.admin.listUsers({ perPage: 1000 }),
      adminClient
        .from("profiles")
        .select("id, full_name, role, institution_id, institutions ( nombre )"),
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
        institutionId: p.institution_id as string | null,
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
        institutionId: profile?.institutionId ?? null,
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
        Hacé clic en un nombre para editarlo.
      </p>

      <AdminUsersTable rows={rows} />
    </div>
  );
}
