import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// cache() memoiza por request: varias llamadas a getCurrentUser() dentro del
// mismo render (layout + página + acciones) comparten una sola verificación
// de sesión en vez de repetir el round-trip a Supabase Auth cada vez.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
