-- Historial de cambios (auditoría): quién cambió qué, cuándo, valor
-- anterior/nuevo. Se implementa con triggers genéricos en vez de tocar cada
-- server action que guarda notas/asistencia/estudiantes/config — así ningún
-- camino de escritura se queda sin registrar por olvido.

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references sections(id) on delete set null,
  student_id uuid references students(id) on delete set null,
  table_name text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create index audit_log_section_idx on audit_log (section_id, changed_at desc);
create index audit_log_student_idx on audit_log (student_id, changed_at desc);

alter table audit_log enable row level security;

-- Solo lectura para el dueño de la sección; nadie inserta/actualiza/borra
-- directo (eso solo lo hace el trigger, con privilegios propios).
create policy "ver historial de mis secciones" on audit_log
  for select using (section_id is not null and owns_section(section_id));

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
      -- El reordenamiento alfabético reescribe "numero" en cascada sobre
      -- toda la sección constantemente; sin este filtro el historial se
      -- llenaría de ruido en vez de cambios reales.
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

create trigger audit_students
  after insert or update or delete on students
  for each row execute procedure audit_row_change();

create trigger audit_rubric_config
  after insert or update or delete on rubric_config
  for each row execute procedure audit_row_change();

create trigger audit_periods
  after insert or update or delete on periods
  for each row execute procedure audit_row_change();

create trigger audit_cotidiano_scores
  after insert or update or delete on cotidiano_scores
  for each row execute procedure audit_row_change();

create trigger audit_exam_scores
  after insert or update or delete on exam_scores
  for each row execute procedure audit_row_change();

create trigger audit_homework_scores
  after insert or update or delete on homework_scores
  for each row execute procedure audit_row_change();

create trigger audit_project_scores
  after insert or update or delete on project_scores
  for each row execute procedure audit_row_change();

create trigger audit_attendance_records
  after insert or update or delete on attendance_records
  for each row execute procedure audit_row_change();
