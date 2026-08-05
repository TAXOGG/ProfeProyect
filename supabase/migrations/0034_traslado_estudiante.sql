-- Ingreso por traslado: cuando un estudiante se une a la sección a mitad de año,
-- el docente puede elegir si arrastra todas las evaluaciones del periodo o solo
-- las que aplican desde su fecha de ingreso (no le cuentan en contra Cotidiano ni
-- Asistencia de fechas anteriores a que llegara).
alter table students
  add column if not exists fecha_ingreso date,
  add column if not exists evaluaciones_desde_ingreso boolean not null default false;
