-- Permite archivar secciones (ocultarlas del dashboard y el sidebar) sin borrar su data,
-- para que los ciclos escolares anteriores no se acumulen en la vista activa del docente.
alter table sections
  add column archivada boolean not null default false;
