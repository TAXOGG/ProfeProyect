import { requireAdmin } from "@/lib/actions/admin-users";
import { createAdminClient } from "@/lib/supabase/admin";

type FeedbackRow = {
  id: string;
  categoria: string;
  mensaje: string;
  ruta: string | null;
  createdAt: string;
  sectionLabel: string | null;
  userLabel: string;
};

const CATEGORIA_LABEL: Record<string, string> = {
  error: "Error",
  sugerencia: "Sugerencia",
  duda: "Duda",
  otro: "Otro",
};

export default async function AdminFeedbackPage() {
  await requireAdmin();
  const adminClient = createAdminClient();

  const [
    { data: feedback, error: feedbackError },
    { data: authData },
    { data: profiles },
  ] = await Promise.all([
    adminClient
      .from("feedback")
      .select("id, user_id, categoria, mensaje, ruta, created_at, sections ( nombre, asignatura )")
      .order("created_at", { ascending: false }),
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
    adminClient.from("profiles").select("id, full_name"),
  ]);

  if (feedbackError) throw new Error(feedbackError.message);

  const emailById = new Map((authData?.users ?? []).map((u) => [u.id, u.email ?? null]));
  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id as string, p.full_name as string | null]),
  );

  const rows: FeedbackRow[] = (feedback ?? []).map((f) => {
    const section = f.sections as unknown as { nombre: string; asignatura: string } | null;
    const nombre = f.user_id ? nameById.get(f.user_id) : null;
    const correo = f.user_id ? emailById.get(f.user_id) : null;
    return {
      id: f.id,
      categoria: f.categoria,
      mensaje: f.mensaje,
      ruta: f.ruta,
      createdAt: f.created_at,
      sectionLabel: section ? `${section.asignatura} — ${section.nombre}` : null,
      userLabel: nombre || correo || (f.user_id ? "—" : "Usuario eliminado"),
    };
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Feedback</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {rows.length} mensaje{rows.length === 1 ? "" : "s"} recibido{rows.length === 1 ? "" : "s"}.
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Categoría</th>
              <th className="px-4 py-2">Mensaje</th>
              <th className="px-4 py-2">Docente</th>
              <th className="px-4 py-2">Sección</th>
              <th className="px-4 py-2">Ruta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-500">
                  {new Date(r.createdAt).toLocaleString("es-CR")}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-500">
                  {CATEGORIA_LABEL[r.categoria] ?? r.categoria}
                </td>
                <td className="min-w-[240px] px-4 py-2 text-zinc-800">{r.mensaje}</td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-500">{r.userLabel}</td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-500">
                  {r.sectionLabel ?? "—"}
                </td>
                <td className="px-4 py-2 text-xs text-zinc-400">{r.ruta ?? "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-400">
                  No hay feedback todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
