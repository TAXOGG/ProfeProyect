-- Fase 2 · Módulo 4: registro de apoyos educativos por estudiante. El "tipo
-- de apoyo" es texto libre (no una tabla de categorías aparte) para no
-- construir un subsistema de configuración solo para una lista de strings
-- — la interfaz sugiere opciones comunes, pero el docente puede escribir
-- cualquier cosa.
--
-- Las evidencias reutilizan la tabla student_photos ya existente (Fase 1
-- del proyecto, migración 0007): se le agrega una columna opcional para
-- vincular una foto a un registro de apoyo específico, en vez de duplicar
-- el mecanismo de subida de archivos.

create table support_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  section_id uuid not null references sections(id) on delete cascade,
  period_id uuid references periods(id) on delete set null,
  fecha date not null default current_date,
  tipo_apoyo text not null,
  descripcion text not null,
  motivo text,
  contexto text,
  resultado_observado text,
  seguimiento_requerido boolean not null default false,
  proximo_seguimiento date,
  responsable text,
  estado text not null default 'activo' check (estado in ('activo', 'archivado')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table support_record_followups (
  id uuid primary key default gen_random_uuid(),
  support_record_id uuid not null references support_records(id) on delete cascade,
  fecha date not null default current_date,
  nota text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table student_photos add column support_record_id uuid references support_records(id) on delete set null;

create index support_records_section_idx on support_records (section_id);
create index support_records_student_idx on support_records (student_id);
create index support_record_followups_record_idx on support_record_followups (support_record_id);

alter table support_records enable row level security;
alter table support_record_followups enable row level security;

create policy "apoyos de mis secciones" on support_records
  for all using (owns_section(section_id)) with check (owns_section(section_id));

create policy "seguimientos de mis apoyos" on support_record_followups
  for all using (
    exists (
      select 1 from support_records r
      where r.id = support_record_id and owns_section(r.section_id)
    )
  )
  with check (
    exists (
      select 1 from support_records r
      where r.id = support_record_id and owns_section(r.section_id)
    )
  );

-- Extiende el trigger genérico de auditoría (Fase 1) para reconocer esta
-- tabla — es información sensible de estudiantes, la trazabilidad importa
-- más acá que en la mayoría.
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

create trigger audit_support_records
  after insert or update or delete on support_records
  for each row execute procedure audit_row_change();
