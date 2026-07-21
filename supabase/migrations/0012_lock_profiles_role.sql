-- La política "actualizar mi propio perfil" (0001) permite UPDATE en profiles
-- usando (id = auth.uid()) sin restringir columnas: cualquier usuario
-- autenticado podría intentar `update profiles set role='admin' where
-- id=auth.uid()`. Hoy es inofensivo (no hay lógica de admin activa), pero es
-- una escalada de privilegios latente. Este trigger congela `role` contra
-- cambios hechos desde el cliente, incluso vía la policy existente.

create or replace function prevent_role_self_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists lock_profile_role on profiles;
create trigger lock_profile_role
  before update on profiles
  for each row execute procedure prevent_role_self_change();
