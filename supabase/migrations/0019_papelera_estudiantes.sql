-- Papelera para estudiantes: en vez de borrar directo (deleteStudent hacía
-- un DELETE real), se marcan con deleted_at y se pueden restaurar. El
-- borrado real sigue existiendo solo para "vaciar la papelera" a propósito.

alter table students add column deleted_at timestamptz;

-- El reordenamiento por apellido ahora solo mira estudiantes activos, para
-- no contar ni renumerar los que están en la papelera.
create or replace function reorder_students_by_apellido(p_section_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  update students
  set numero = -numero
  where section_id = p_section_id and deleted_at is null;

  with ordenados as (
    select id, row_number() over (
      order by primer_apellido, segundo_apellido nulls first, nombre
    ) as nuevo_numero
    from students
    where section_id = p_section_id and deleted_at is null
  )
  update students s
  set numero = o.nuevo_numero
  from ordenados o
  where s.id = o.id;
end;
$$;

grant execute on function reorder_students_by_apellido(uuid) to authenticated;

-- Manda un estudiante a la papelera. Le niega el numero (lo vuelve
-- negativo) para liberar ese lugar en el unique(section_id, numero) sin
-- chocar con otros estudiantes activos o ya borrados.
create or replace function soft_delete_student(p_student_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  update students
  set deleted_at = now(), numero = -abs(numero)
  where id = p_student_id and deleted_at is null;
end;
$$;

grant execute on function soft_delete_student(uuid) to authenticated;

-- Saca a un estudiante de la papelera y reordena la sección para darle un
-- numero nuevo (el que tenía pudo haber quedado ocupado mientras tanto).
create or replace function restore_student(p_student_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_section_id uuid;
begin
  update students
  set deleted_at = null
  where id = p_student_id
  returning section_id into v_section_id;

  if v_section_id is not null then
    perform reorder_students_by_apellido(v_section_id);
  end if;
end;
$$;

grant execute on function restore_student(uuid) to authenticated;
