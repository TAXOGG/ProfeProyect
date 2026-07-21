-- Fotos de respaldo por estudiante: evidencia de tareas, trabajo cotidiano, o cualquier
-- situación que el docente quiera documentar (ej. un alumno con problemas recurrentes).
-- Bucket privado; cada docente solo puede leer/escribir dentro de su propia carpeta
-- (path = {auth.uid()}/{student_id}/{archivo}).

insert into storage.buckets (id, name, public)
values ('student-photos', 'student-photos', false)
on conflict (id) do nothing;

create policy "docente sube sus propias fotos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'student-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "docente ve sus propias fotos" on storage.objects
  for select to authenticated
  using (bucket_id = 'student-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "docente borra sus propias fotos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'student-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create table student_photos (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  section_id uuid not null references sections(id) on delete cascade,
  categoria text,
  nota text,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table student_photos enable row level security;

create policy "student_photos por seccion" on student_photos
  for all using (owns_section(section_id)) with check (owns_section(section_id));
