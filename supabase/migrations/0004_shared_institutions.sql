-- Las instituciones pasan a ser un catálogo COMPARTIDO (no un tenant de seguridad):
-- un mismo docente puede tener secciones en varios colegios (ej. Santa Ana y Desamparados).
-- La seguridad ahora depende únicamente de teacher_id, sin importar la institución.

drop policy if exists "ver institucion propia" on institutions;
create policy "catalogo de instituciones visible para autenticados" on institutions
  for select to authenticated using (true);

drop policy if exists "ver perfiles de mi institucion" on profiles;
create policy "ver mi propio perfil" on profiles
  for select using (id = auth.uid());

drop policy if exists "secciones de mi institucion" on sections;
drop policy if exists "crear seccion en mi institucion" on sections;
drop policy if exists "modificar mis secciones" on sections;
drop policy if exists "borrar mis secciones" on sections;

create policy "secciones propias del docente" on sections
  for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

create or replace function owns_section(sec_id uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from sections where id = sec_id and teacher_id = auth.uid()
  );
$$;

drop function if exists auth_institution_id();
drop function if exists is_admin();
