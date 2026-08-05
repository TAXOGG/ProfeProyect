-- Logo de la institución, para mostrarlo en el encabezado de los PDFs oficiales
-- (certificado de notas, informe integral, reportes de rubro). Las instituciones
-- son un catálogo compartido (ver 0004_shared_institutions.sql): cualquier docente
-- con al menos una sección activa en esa institución puede subir/reemplazar su logo,
-- igual que cualquiera de ellos ya puede ver el nombre y los datos MEP compartidos.

alter table institutions add column logo_path text;

insert into storage.buckets (id, name, public)
values ('institution-logos', 'institution-logos', true)
on conflict (id) do nothing;

create or replace function owns_institution(inst_id uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from sections where institution_id = inst_id and teacher_id = auth.uid()
  );
$$;

create policy "docente de la institucion actualiza su logo" on institutions
  for update to authenticated
  using (owns_institution(id))
  with check (owns_institution(id));

create policy "logos de institucion visibles publicamente" on storage.objects
  for select using (bucket_id = 'institution-logos');

create policy "docente de la institucion sube su logo" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'institution-logos'
    and owns_institution(((storage.foldername(name))[1])::uuid)
  );

create policy "docente de la institucion reemplaza su logo" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'institution-logos'
    and owns_institution(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'institution-logos'
    and owns_institution(((storage.foldername(name))[1])::uuid)
  );

create policy "docente de la institucion borra su logo" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'institution-logos'
    and owns_institution(((storage.foldername(name))[1])::uuid)
  );
