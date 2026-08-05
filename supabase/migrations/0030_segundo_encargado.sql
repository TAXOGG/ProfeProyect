-- Segundo encargado del estudiante (nombre, parentesco, correo). telefono1/telefono2
-- ya existían en el esquema inicial pero nunca se usaron desde ningún formulario;
-- pasan a representar el teléfono del encargado 1 y del encargado 2 respectivamente.
alter table students
  add column contacto2_nombre text,
  add column contacto2_parentesco text,
  add column contacto2_correo text;
