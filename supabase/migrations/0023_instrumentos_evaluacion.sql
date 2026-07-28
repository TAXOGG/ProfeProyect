-- Fase 2 · Módulo 1-2: constructor de instrumentos de evaluación (rúbricas,
-- listas de cotejo, escalas de valoración, rúbricas holísticas, registro
-- anecdótico) y su aplicación, que escribe la nota resultante en el rubro
-- de siempre (Cotidiano/Pruebas/Tareas/Proyecto) en vez de ser una
-- categoría paralela.
--
-- Un instrumento es personal del docente (owner_id), reutilizable entre
-- secciones — vive en su "biblioteca", no dentro de una sección específica.
-- Al aplicarlo a una sección/periodo queda instrument_applications, y por
-- cada estudiante instrument_results guarda qué nivel se eligió en cada
-- criterio y el puntaje resultante, con una referencia trazable de vuelta
-- al instrumento.

create table instruments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  descripcion text,
  tipo text not null check (
    tipo in ('rubrica_analitica', 'rubrica_holistica', 'lista_cotejo', 'escala_valoracion', 'registro_anecdotico')
  ),
  materia text,
  nivel text,
  instrucciones text,
  estado text not null default 'borrador' check (estado in ('borrador', 'activo', 'aplicado', 'archivado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table instrument_criteria (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid not null references instruments(id) on delete cascade,
  orden int not null,
  descripcion text not null
);

create table instrument_levels (
  id uuid primary key default gen_random_uuid(),
  criterio_id uuid not null references instrument_criteria(id) on delete cascade,
  orden int not null,
  nombre text not null,
  descripcion text,
  puntaje numeric not null check (puntaje >= 0)
);

create table instrument_applications (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid not null references instruments(id) on delete cascade,
  section_id uuid not null references sections(id) on delete cascade,
  period_id uuid not null references periods(id) on delete cascade,
  rubro_destino text check (rubro_destino in ('cotidiano', 'pruebas', 'tareas', 'proyecto')),
  target_kind text check (target_kind in ('cotidiano_indicator', 'exam', 'homework_item', 'project_stage')),
  target_id uuid,
  fecha date not null default current_date,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'completada')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table instrument_results (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references instrument_applications(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  criterio_scores jsonb not null default '{}'::jsonb,
  puntaje_obtenido numeric,
  observacion text,
  estado text not null default 'borrador' check (estado in ('borrador', 'completado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, student_id)
);

create index instrument_criteria_instrument_idx on instrument_criteria (instrument_id);
create index instrument_levels_criterio_idx on instrument_levels (criterio_id);
create index instrument_applications_section_idx on instrument_applications (section_id);
create index instrument_results_application_idx on instrument_results (application_id);
create index instrument_results_student_idx on instrument_results (student_id);

alter table instruments enable row level security;
alter table instrument_criteria enable row level security;
alter table instrument_levels enable row level security;
alter table instrument_applications enable row level security;
alter table instrument_results enable row level security;

create policy "instrumentos propios" on instruments
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "criterios de mis instrumentos" on instrument_criteria
  for all using (
    exists (select 1 from instruments i where i.id = instrument_id and i.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from instruments i where i.id = instrument_id and i.owner_id = auth.uid())
  );

create policy "niveles de mis instrumentos" on instrument_levels
  for all using (
    exists (
      select 1 from instrument_criteria c
      join instruments i on i.id = c.instrument_id
      where c.id = criterio_id and i.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from instrument_criteria c
      join instruments i on i.id = c.instrument_id
      where c.id = criterio_id and i.owner_id = auth.uid()
    )
  );

create policy "aplicaciones de mis secciones" on instrument_applications
  for all using (owns_section(section_id)) with check (owns_section(section_id));

create policy "resultados de mis aplicaciones" on instrument_results
  for all using (
    exists (
      select 1 from instrument_applications a
      where a.id = application_id and owns_section(a.section_id)
    )
  )
  with check (
    exists (
      select 1 from instrument_applications a
      where a.id = application_id and owns_section(a.section_id)
    )
  );

-- Reutiliza el trigger genérico de auditoría (Fase 1): se extiende la
-- función existente para reconocer instrument_results antes de engancharle
-- el trigger nuevo.
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

create trigger audit_instrument_results
  after insert or update or delete on instrument_results
  for each row execute procedure audit_row_change();
