-- Tipo de Adecuación con las categorías oficiales del MEP, como campo estructurado
-- aparte del texto libre en tipo_apoyo (que sigue existiendo para detalle).
alter table students
  add column adecuacion text not null default 'no_presenta'
  check (adecuacion in ('no_presenta', 'acceso', 'curricular_significativa', 'curricular_no_significativa'));
