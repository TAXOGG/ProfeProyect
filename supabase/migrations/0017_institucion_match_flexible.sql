-- Al crear una sección con "Agregar institución nueva", antes se buscaba una
-- coincidencia exacta (solo ignorando mayúsculas/minúsculas) antes de crear
-- una institución nueva. "Liceo de Santa Ana" y "Liceo Santa Ana" (o con
-- acentos distintos) no se reconocían como la misma, y con el tiempo se
-- iban acumulando instituciones duplicadas. Esta migración compara nombres
-- normalizados (sin acentos, sin artículos, espacios colapsados) para
-- reutilizar la institución existente en esos casos.

create extension if not exists unaccent;

create or replace function normalize_institution_name(p_nombre text)
returns text
language sql
immutable
as $$
  select trim(
    regexp_replace(
      regexp_replace(unaccent(lower(coalesce(p_nombre, ''))), '\y(de|del|la|las|el|los|y)\y', ' ', 'g'),
      '\s+', ' ', 'g'
    )
  );
$$;

create or replace function find_or_create_institution(
  p_nombre text,
  p_direccion_regional text,
  p_circuito text,
  p_provincia text,
  p_canton text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_normalized text := normalize_institution_name(p_nombre);
  v_id uuid;
begin
  select id into v_id
  from institutions
  where normalize_institution_name(nombre) = v_normalized
  limit 1;

  if v_id is not null then
    return v_id;
  end if;

  insert into institutions (nombre, direccion_regional, circuito, provincia, canton)
  values (
    p_nombre,
    nullif(p_direccion_regional, ''),
    nullif(p_circuito, ''),
    nullif(p_provincia, ''),
    nullif(p_canton, '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function find_or_create_institution(text, text, text, text, text) to authenticated;
