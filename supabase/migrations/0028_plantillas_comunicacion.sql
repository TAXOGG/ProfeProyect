-- Fase 2 · Módulo 3: biblioteca de plantillas. Instrumentos (0023) y
-- Observaciones reutilizables (0025) ya son bibliotecas de plantillas
-- personales con búsqueda/filtro/favoritos — no se reconstruyen. Lo único
-- que faltaba era una plantilla reutilizable para Comunicaciones (0027),
-- que hoy solo tiene un texto inicial fijo por tipo. La tabla es
-- intencionalmente idéntica en forma a observation_templates para poder
-- reutilizar el mismo componente de selección (ObservationPicker) en el
-- formulario de comunicaciones.

create table communication_templates (
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

create index communication_templates_owner_idx on communication_templates (owner_id);

alter table communication_templates enable row level security;

create policy "plantillas de comunicacion propias" on communication_templates
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
