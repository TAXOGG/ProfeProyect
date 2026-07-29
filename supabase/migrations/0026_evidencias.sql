-- Fase 2 · Módulo 6: gestión de evidencias. Mejora lo existente (fotos de
-- respaldo, migración 0007) en vez de crear un sistema paralelo:
--   - admite PDF además de imágenes (file_type/file_name)
--   - soft-delete (deleted_at), igual que estudiantes (0019) y notas (0038)
--   - vínculo opcional con un resultado de instrumento (instrument_results),
--     igual que ya existe el vínculo opcional con un registro de apoyo

alter table student_photos
  add column file_type text not null default 'imagen' check (file_type in ('imagen', 'pdf')),
  add column file_name text,
  add column instrument_result_id uuid references instrument_results(id) on delete set null,
  add column deleted_at timestamptz;

create index student_photos_instrument_result_idx on student_photos (instrument_result_id);

-- Extiende el trigger genérico de auditoría (Fase 1) para reconocer esta
-- tabla — no estaba cubierta desde la migración 0007 original.
create or replace function audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_section_id uuid;
  v_student_id uuid;
begin
  case TG_TABLE_NAME
    when 'students' then
      if TG_OP = 'UPDATE'
        and old.numero is distinct from new.numero
        and old.primer_apellido is not distinct from new.primer_apellido
        and old.segundo_apellido is not distinct from new.segundo_apellido
        and old.nombre is not distinct from new.nombre
        and old.identificacion is not distinct from new.identificacion
        and old.sexo is not distinct from new.sexo
        and old.tipo_apoyo is not distinct from new.tipo_apoyo
        and old.estado is not distinct from new.estado
        and old.deleted_at is not distinct from new.deleted_at
        and old.contacto_nombre is not distinct from new.contacto_nombre
        and old.contacto_parentesco is not distinct from new.contacto_parentesco
        and old.contacto_correo is not distinct from new.contacto_correo
      then
        return coalesce(new, old);
      end if;
      v_section_id := coalesce(new.section_id, old.section_id);
      v_student_id := coalesce(new.id, old.id);
    when 'rubric_config' then
      v_section_id := coalesce(new.section_id, old.section_id);
    when 'periods' then
      v_section_id := coalesce(new.section_id, old.section_id);
    when 'cotidiano_scores' then
      select section_id into v_section_id from cotidiano_indicators
        where id = coalesce(new.indicator_id, old.indicator_id);
      v_student_id := coalesce(new.student_id, old.student_id);
    when 'exam_scores' then
      select section_id into v_section_id from exams
        where id = coalesce(new.exam_id, old.exam_id);
      v_student_id := coalesce(new.student_id, old.student_id);
    when 'homework_scores' then
      select section_id into v_section_id from homework_items
        where id = coalesce(new.homework_id, old.homework_id);
      v_student_id := coalesce(new.student_id, old.student_id);
    when 'project_scores' then
      select section_id into v_section_id from project_stages
        where id = coalesce(new.stage_id, old.stage_id);
      v_student_id := coalesce(new.student_id, old.student_id);
    when 'attendance_records' then
      select section_id into v_section_id from attendance_sessions
        where id = coalesce(new.session_id, old.session_id);
      v_student_id := coalesce(new.student_id, old.student_id);
    when 'instrument_results' then
      select section_id into v_section_id from instrument_applications
        where id = coalesce(new.application_id, old.application_id);
      v_student_id := coalesce(new.student_id, old.student_id);
    when 'support_records' then
      v_section_id := coalesce(new.section_id, old.section_id);
      v_student_id := coalesce(new.student_id, old.student_id);
    when 'student_photos' then
      v_section_id := coalesce(new.section_id, old.section_id);
      v_student_id := coalesce(new.student_id, old.student_id);
    else
      v_section_id := null;
  end case;

  insert into audit_log (section_id, student_id, table_name, action, old_data, new_data, changed_by)
  values (
    v_section_id,
    v_student_id,
    TG_TABLE_NAME,
    TG_OP,
    case when TG_OP != 'INSERT' then to_jsonb(old) else null end,
    case when TG_OP != 'DELETE' then to_jsonb(new) else null end,
    auth.uid()
  );

  return coalesce(new, old);
end;
$$;

create trigger audit_student_photos
  after insert or update or delete on student_photos
  for each row execute procedure audit_row_change();
