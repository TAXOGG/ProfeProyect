-- Normaliza estudiantes existentes y agrega soporte para:
--   1) Nombres/apellidos siempre en mayúsculas (estandarización).
--   2) Código de sexo H(Hombre)/M(Mujer) en vez de M(Masculino)/F(Femenino).
--   3) Reordenar y renumerar una sección completa por primer apellido al
--      agregar un estudiante nuevo (para que la lista quede siempre
--      ordenada alfabéticamente, no por orden de inserción).

-- 1) Backfill: mayúsculas en nombres/apellidos ya guardados.
update students
set
  primer_apellido = upper(primer_apellido),
  segundo_apellido = upper(segundo_apellido),
  nombre = upper(nombre)
where
  primer_apellido <> upper(primer_apellido)
  or (segundo_apellido is not null and segundo_apellido <> upper(segundo_apellido))
  or nombre <> upper(nombre);

-- 2) Migrar códigos de sexo. El orden importa: primero liberamos 'M' viejo
-- (Masculino) hacia 'H' antes de reasignar 'F' (Femenino) hacia 'M' (Mujer),
-- para no chocar el significado de la letra "M" a mitad de camino.
update students set sexo = 'H' where sexo = 'M';
update students set sexo = 'M' where sexo = 'F';

-- 3) Reordena y renumera los estudiantes de una sección por primer/segundo
-- apellido y nombre. Corre con los privilegios del usuario que la invoca
-- (no security definer), así que las policies RLS de "students" siguen
-- exigiendo que sea dueño de la sección.
create or replace function reorder_students_by_apellido(p_section_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  -- Fase 1: liberar los números actuales (negativos, no chocan con el
  -- unique(section_id, numero) mientras reasignamos en la fase 2).
  update students
  set numero = -numero
  where section_id = p_section_id;

  -- Fase 2: asignar número secuencial según orden alfabético.
  with ordenados as (
    select id, row_number() over (
      order by primer_apellido, segundo_apellido nulls first, nombre
    ) as nuevo_numero
    from students
    where section_id = p_section_id
  )
  update students s
  set numero = o.nuevo_numero
  from ordenados o
  where s.id = o.id;
end;
$$;

grant execute on function reorder_students_by_apellido(uuid) to authenticated;
