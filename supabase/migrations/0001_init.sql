-- ProfeProyecto: esquema inicial multi-colegio (SaaS)
-- Jerarquia: institution -> profile (docente/admin) -> section -> students / rubros / notas

create extension if not exists "pgcrypto";

-- ============ INSTITUCIONES Y PERFILES ============

create table institutions (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion_regional text,
  circuito text,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  institution_id uuid references institutions(id) on delete set null,
  full_name text,
  role text not null default 'docente' check (role in ('admin', 'docente')),
  created_at timestamptz not null default now()
);

-- crea el profile automaticamente cuando se registra un usuario nuevo
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============ SECCIONES (una por docente+asignatura+grupo) ============

create table sections (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete cascade,
  teacher_id uuid not null references profiles(id) on delete cascade,
  nombre text not null,          -- ej: "10-1"
  nivel text not null,           -- ej: "DÉCIMO"
  asignatura text not null,      -- ej: "Física"
  ciclo_escolar int not null,
  nota_minima numeric not null default 70,
  cantidad_periodos int not null default 2,
  created_at timestamptz not null default now()
);

create table periods (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references sections(id) on delete cascade,
  numero int not null,
  nombre text not null,          -- ej: "Primer Periodo"
  porcentaje numeric not null default 0.5,
  unique (section_id, numero)
);

-- distribucion de la evaluacion (rubros habilitados/deshabilitados via %=0)
create table rubric_config (
  section_id uuid primary key references sections(id) on delete cascade,
  cotidiano_pct numeric not null default 0.35,
  tareas_pct numeric not null default 0.10,
  asistencia_pct numeric not null default 0.05,
  proyecto_pct numeric not null default 0,
  pruebas_pct numeric not null default 0.50,
  constraint rubric_total_100 check (
    cotidiano_pct + tareas_pct + asistencia_pct + proyecto_pct + pruebas_pct = 1
  )
);

-- ============ ESTUDIANTES ============

create table students (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references sections(id) on delete cascade,
  numero int not null,
  primer_apellido text not null,
  segundo_apellido text,
  nombre text not null,
  identificacion text,
  edad int,
  sexo text,
  tipo_apoyo text default 'No tiene',
  estado text not null default 'activo' check (estado in ('activo', 'trasladado', 'salido')),
  correo_mep text,
  correo_alternativo text,
  telefono1 text,
  telefono2 text,
  contacto_nombre text,
  contacto_parentesco text,
  created_at timestamptz not null default now(),
  unique (section_id, numero)
);

-- ============ TRABAJO COTIDIANO ============

create table cotidiano_indicators (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references sections(id) on delete cascade,
  period_id uuid not null references periods(id) on delete cascade,
  numero int not null,
  descripcion text not null,
  fecha_aplicacion date,
  puntos_max numeric not null default 3
);

create table cotidiano_scores (
  indicator_id uuid not null references cotidiano_indicators(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  puntaje numeric not null default 0,
  primary key (indicator_id, student_id)
);

-- ============ PRUEBAS ============

create table exams (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references sections(id) on delete cascade,
  period_id uuid not null references periods(id) on delete cascade,
  numero int not null,
  nombre text not null,
  puntos_max numeric not null,
  porcentaje_relativo numeric not null default 1
);

create table exam_scores (
  exam_id uuid not null references exams(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  puntos_obtenidos numeric not null default 0,
  primary key (exam_id, student_id)
);

-- ============ TAREAS ============

create table homework_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references sections(id) on delete cascade,
  period_id uuid not null references periods(id) on delete cascade,
  numero int not null,
  descripcion text,
  fecha date
);

create table homework_scores (
  homework_id uuid not null references homework_items(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  nota numeric not null default 0,
  primary key (homework_id, student_id)
);

-- ============ PROYECTO ============

create table project_stages (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references sections(id) on delete cascade,
  period_id uuid not null references periods(id) on delete cascade,
  nombre text not null,
  puntos_max numeric not null
);

create table project_scores (
  stage_id uuid not null references project_stages(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  puntos_obtenidos numeric not null default 0,
  primary key (stage_id, student_id)
);

-- ============ ASISTENCIA ============

create table attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references sections(id) on delete cascade,
  period_id uuid not null references periods(id) on delete cascade,
  fecha date not null,
  lecciones_impartidas int not null default 1
);

create table attendance_records (
  session_id uuid not null references attendance_sessions(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  ausencias numeric not null default 0,
  justificada boolean not null default false,
  tardia boolean not null default false,
  primary key (session_id, student_id)
);

-- ============ RLS ============

create function auth_institution_id()
returns uuid
language sql stable
security definer set search_path = public
as $$
  select institution_id from profiles where id = auth.uid();
$$;

create function is_admin()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false);
$$;

create function owns_section(sec_id uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from sections
    where id = sec_id
      and institution_id = auth_institution_id()
      and (teacher_id = auth.uid() or is_admin())
  );
$$;

alter table institutions enable row level security;
alter table profiles enable row level security;
alter table sections enable row level security;
alter table periods enable row level security;
alter table rubric_config enable row level security;
alter table students enable row level security;
alter table cotidiano_indicators enable row level security;
alter table cotidiano_scores enable row level security;
alter table exams enable row level security;
alter table exam_scores enable row level security;
alter table homework_items enable row level security;
alter table homework_scores enable row level security;
alter table project_stages enable row level security;
alter table project_scores enable row level security;
alter table attendance_sessions enable row level security;
alter table attendance_records enable row level security;

create policy "ver institucion propia" on institutions
  for select using (id = auth_institution_id());
create policy "crear institucion en onboarding" on institutions
  for insert to authenticated with check (true);

create policy "ver perfiles de mi institucion" on profiles
  for select using (institution_id = auth_institution_id() or id = auth.uid());
create policy "actualizar mi propio perfil" on profiles
  for update using (id = auth.uid());

create policy "secciones de mi institucion" on sections
  for select using (institution_id = auth_institution_id());
create policy "crear seccion en mi institucion" on sections
  for insert with check (institution_id = auth_institution_id() and (teacher_id = auth.uid() or is_admin()));
create policy "modificar mis secciones" on sections
  for update using (institution_id = auth_institution_id() and (teacher_id = auth.uid() or is_admin()));
create policy "borrar mis secciones" on sections
  for delete using (institution_id = auth_institution_id() and (teacher_id = auth.uid() or is_admin()));

create policy "periods por seccion" on periods
  for all using (owns_section(section_id)) with check (owns_section(section_id));
create policy "rubric_config por seccion" on rubric_config
  for all using (owns_section(section_id)) with check (owns_section(section_id));
create policy "students por seccion" on students
  for all using (owns_section(section_id)) with check (owns_section(section_id));
create policy "cotidiano_indicators por seccion" on cotidiano_indicators
  for all using (owns_section(section_id)) with check (owns_section(section_id));
create policy "exams por seccion" on exams
  for all using (owns_section(section_id)) with check (owns_section(section_id));
create policy "homework_items por seccion" on homework_items
  for all using (owns_section(section_id)) with check (owns_section(section_id));
create policy "project_stages por seccion" on project_stages
  for all using (owns_section(section_id)) with check (owns_section(section_id));
create policy "attendance_sessions por seccion" on attendance_sessions
  for all using (owns_section(section_id)) with check (owns_section(section_id));

create policy "cotidiano_scores por indicador" on cotidiano_scores
  for all using (exists (select 1 from cotidiano_indicators i where i.id = indicator_id and owns_section(i.section_id)))
  with check (exists (select 1 from cotidiano_indicators i where i.id = indicator_id and owns_section(i.section_id)));

create policy "exam_scores por examen" on exam_scores
  for all using (exists (select 1 from exams e where e.id = exam_id and owns_section(e.section_id)))
  with check (exists (select 1 from exams e where e.id = exam_id and owns_section(e.section_id)));

create policy "homework_scores por tarea" on homework_scores
  for all using (exists (select 1 from homework_items h where h.id = homework_id and owns_section(h.section_id)))
  with check (exists (select 1 from homework_items h where h.id = homework_id and owns_section(h.section_id)));

create policy "project_scores por etapa" on project_scores
  for all using (exists (select 1 from project_stages s where s.id = stage_id and owns_section(s.section_id)))
  with check (exists (select 1 from project_stages s where s.id = stage_id and owns_section(s.section_id)));

create policy "attendance_records por sesion" on attendance_records
  for all using (exists (select 1 from attendance_sessions s where s.id = session_id and owns_section(s.section_id)))
  with check (exists (select 1 from attendance_sessions s where s.id = session_id and owns_section(s.section_id)));
