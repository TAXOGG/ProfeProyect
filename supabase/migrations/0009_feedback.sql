-- Feedback/soporte de docentes durante el periodo de pruebas de ARCE.
-- Cualquier usuario autenticado puede insertar su propio feedback; se revisa
-- manualmente desde el dashboard de Supabase (no hay policy de select).

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  categoria text not null check (categoria in ('error', 'sugerencia', 'duda', 'otro')),
  mensaje text not null,
  ruta text,
  section_id uuid references sections(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;

create policy "usuarios autenticados registran su propio feedback" on feedback
  for insert to authenticated with check (auth.uid() = user_id);
