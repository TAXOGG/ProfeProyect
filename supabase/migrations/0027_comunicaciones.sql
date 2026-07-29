-- Fase 2 · Módulo 9: centro de comunicaciones con encargados. El objetivo
-- de esta fase es preparar y registrar comunicaciones, no automatizar envíos
-- masivos: para medio "correo" sí se envía de verdad (reutiliza Resend, ya
-- aprobado desde Fase 1) porque ahí ARCE tiene confirmación técnica real del
-- envío; para el resto de medios (llamada, reunión, mensajería, impreso,
-- otro) el docente solo puede registrar manualmente que ya la hizo, nunca se
-- marca "enviada" sin esa confirmación.

create table communications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  section_id uuid not null references sections(id) on delete cascade,
  period_id uuid references periods(id) on delete set null,
  tipo text not null check (
    tipo in ('progreso', 'ausencia', 'trabajo_pendiente', 'convocatoria', 'reconocimiento', 'seguimiento', 'personalizada')
  ),
  medio text not null check (medio in ('correo', 'llamada', 'reunion', 'mensajeria', 'impresa', 'otro')),
  destinatario text,
  mensaje text not null,
  adjunta_informe boolean not null default false,
  estado text not null default 'preparada' check (estado in ('preparada', 'enviada', 'registrada_manualmente')),
  fecha_realizada date,
  observacion text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index communications_section_idx on communications (section_id);
create index communications_student_idx on communications (student_id);

alter table communications enable row level security;

create policy "comunicaciones de mis secciones" on communications
  for all using (owns_section(section_id)) with check (owns_section(section_id));

-- Extiende el trigger genérico de auditoría (Fase 1): comunicaciones con
-- encargados es información sensible, igual que apoyos.
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
    when 'communications' then
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

create trigger audit_communications
  after insert or update or delete on communications
  for each row execute procedure audit_row_change();
