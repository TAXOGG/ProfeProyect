-- Fase 2 · Módulo 10: banco personal de observaciones/comentarios
-- reutilizables, con variables tipo {{nombre_estudiante}} que se resuelven
-- al insertarlas (la resolución y validación vive en la aplicación, no acá
-- — la base solo guarda el texto con las plantillas sin resolver).

create table observation_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  categoria text,
  materia text,
  nivel text,
  texto text not null,
  favorito boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index observation_templates_owner_idx on observation_templates (owner_id);

alter table observation_templates enable row level security;

create policy "observaciones propias" on observation_templates
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
