-- Las migraciones 0010_asistencia_nota.sql y 0011_asistencia_umbrales.sql agregaban
-- estas columnas, pero nunca se corrieron contra la base de datos real (se detectó
-- al intentar guardar un umbral desde Ajustes: primero "column
-- rubric_config.asistencia_advertencia_pct does not exist", y tras corregir eso,
-- "column rubric_config.asistencia_nota does not exist"). Esto significa que el
-- coloreado de la grilla de Asistencia, la nota de política de asistencia en el
-- correo a padres, y ahora las Alertas Tempranas del Dashboard, nunca tuvieron dónde
-- guardar sus datos en producción. Usamos "if not exists" por si en algún ambiente
-- sí llegaron a correr.
alter table rubric_config
  add column if not exists asistencia_advertencia_pct numeric,
  add column if not exists asistencia_limite_pct numeric,
  add column if not exists asistencia_nota text;
