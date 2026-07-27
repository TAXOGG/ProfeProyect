-- Permite que la creación de una cuenta desde /admin/nuevo-usuario deje el
-- perfil completo desde el inicio (nombre + institución), en vez de crear un
-- perfil vacío que haya que corregir a mano después. El nombre ya se leía de
-- raw_user_meta_data; ahora también se lee institution_id si viene incluido.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, institution_id)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    nullif(new.raw_user_meta_data ->> 'institution_id', '')::uuid
  );
  return new;
end;
$$;
