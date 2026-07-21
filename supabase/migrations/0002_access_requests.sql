-- Solicitudes de acceso: el sistema no es de registro abierto.
-- Cualquiera puede enviar una solicitud (insert), pero solo se revisan
-- manualmente desde el dashboard de Supabase (no hay policy de select
-- para anon/authenticated a propósito).

create table access_requests (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  correo text not null,
  institucion text not null,
  telefono text,
  mensaje text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado')),
  created_at timestamptz not null default now()
);

alter table access_requests enable row level security;

create policy "cualquiera puede solicitar acceso" on access_requests
  for insert to anon, authenticated with check (true);
