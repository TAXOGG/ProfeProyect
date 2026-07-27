import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente con privilegios de administrador (service role). Solo debe usarse
// en server actions/route handlers, nunca en código que llegue al navegador.
// Permite crear usuarios (auth.admin.*) sin pasar por las policies RLS.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Falta configurar SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.",
    );
  }
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
