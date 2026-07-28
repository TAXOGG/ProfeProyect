-- La migración 0012 congeló profiles.role contra cualquier UPDATE para
-- evitar que un docente se autoasigne el rol admin desde el cliente normal.
-- Esa protección debe seguir aplicando ahí, pero ahora /admin/usuarios
-- necesita poder cambiar el rol de otra cuenta usando el cliente de service
-- role. Se distingue por el rol de Postgres de la conexión: las peticiones
-- con la service role key corren como `service_role` (así es como ya
-- bypasean RLS en el resto del panel de admin), las de un usuario logueado
-- normal corren como `authenticated`.

create or replace function prevent_role_self_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if current_setting('role', true) = 'service_role' then
    return new;
  end if;
  if new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$;
