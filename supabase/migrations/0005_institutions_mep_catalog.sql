-- Campos adicionales para el catálogo oficial de centros educativos del MEP.
alter table institutions
  add column codigo_presupuestario text,
  add column provincia text,
  add column canton text,
  add column distrito text,
  add column dependencia text; -- PUB / PRI / SUBV

create extension if not exists pg_trgm;
create index institutions_nombre_idx on institutions using gin (nombre gin_trgm_ops);
