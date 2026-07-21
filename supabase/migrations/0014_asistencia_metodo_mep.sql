alter table rubric_config
  add column asistencia_metodo text not null default 'lineal'
    check (asistencia_metodo in ('lineal', 'mep'));
