-- Cierre y reapertura controlada de periodos. Un periodo cerrado no puede
-- recibir cambios en notas/asistencia (ni en los indicadores/pruebas/tareas/
-- etapas/sesiones que los definen) desde ningún camino de escritura, no solo
-- desde la UI: la protección vive en triggers, no en el formulario.

alter table periods
  add column estado text not null default 'activo'
    check (estado in ('borrador', 'activo', 'cerrado', 'reabierto')),
  add column cerrado_at timestamptz,
  add column cerrado_por uuid references auth.users(id) on delete set null,
  add column razon_reapertura text;

create or replace function period_is_closed(p_period_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select estado = 'cerrado' from periods where id = p_period_id), false);
$$;

create or replace function block_write_if_period_closed()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_period_id uuid;
begin
  case TG_TABLE_NAME
    when 'cotidiano_indicators' then
      v_period_id := coalesce(new.period_id, old.period_id);
    when 'exams' then
      v_period_id := coalesce(new.period_id, old.period_id);
    when 'homework_items' then
      v_period_id := coalesce(new.period_id, old.period_id);
    when 'project_stages' then
      v_period_id := coalesce(new.period_id, old.period_id);
    when 'attendance_sessions' then
      v_period_id := coalesce(new.period_id, old.period_id);
    when 'cotidiano_scores' then
      select period_id into v_period_id from cotidiano_indicators
        where id = coalesce(new.indicator_id, old.indicator_id);
    when 'exam_scores' then
      select period_id into v_period_id from exams
        where id = coalesce(new.exam_id, old.exam_id);
    when 'homework_scores' then
      select period_id into v_period_id from homework_items
        where id = coalesce(new.homework_id, old.homework_id);
    when 'project_scores' then
      select period_id into v_period_id from project_stages
        where id = coalesce(new.stage_id, old.stage_id);
    when 'attendance_records' then
      select period_id into v_period_id from attendance_sessions
        where id = coalesce(new.session_id, old.session_id);
  end case;

  if period_is_closed(v_period_id) then
    raise exception 'Este periodo está cerrado. Reabrilo desde Ajustes para poder modificar esto.';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger block_cotidiano_indicators_if_closed
  before insert or update or delete on cotidiano_indicators
  for each row execute procedure block_write_if_period_closed();
create trigger block_exams_if_closed
  before insert or update or delete on exams
  for each row execute procedure block_write_if_period_closed();
create trigger block_homework_items_if_closed
  before insert or update or delete on homework_items
  for each row execute procedure block_write_if_period_closed();
create trigger block_project_stages_if_closed
  before insert or update or delete on project_stages
  for each row execute procedure block_write_if_period_closed();
create trigger block_attendance_sessions_if_closed
  before insert or update or delete on attendance_sessions
  for each row execute procedure block_write_if_period_closed();

create trigger block_cotidiano_scores_if_closed
  before insert or update or delete on cotidiano_scores
  for each row execute procedure block_write_if_period_closed();
create trigger block_exam_scores_if_closed
  before insert or update or delete on exam_scores
  for each row execute procedure block_write_if_period_closed();
create trigger block_homework_scores_if_closed
  before insert or update or delete on homework_scores
  for each row execute procedure block_write_if_period_closed();
create trigger block_project_scores_if_closed
  before insert or update or delete on project_scores
  for each row execute procedure block_write_if_period_closed();
create trigger block_attendance_records_if_closed
  before insert or update or delete on attendance_records
  for each row execute procedure block_write_if_period_closed();
