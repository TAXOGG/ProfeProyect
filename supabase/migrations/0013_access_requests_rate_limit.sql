-- Permite contar solicitudes recientes por correo sin abrir una policy de
-- SELECT sobre access_requests (que expondría nombre/teléfono/mensaje de
-- todas las solicitudes a cualquiera con la anon key). La función corre con
-- privilegios elevados pero solo devuelve un número.

create or replace function count_recent_access_requests(p_correo text)
returns int
language sql
security definer set search_path = public
as $$
  select count(*)::int
  from access_requests
  where correo = p_correo
    and created_at > now() - interval '1 hour';
$$;

grant execute on function count_recent_access_requests(text) to anon, authenticated;

-- Mismo motivo para feedback: no tiene policy de SELECT (a propósito), así
-- que un conteo para throttling necesita pasar por una función con
-- privilegios elevados en vez de una consulta directa desde el cliente.

create or replace function count_recent_feedback(p_user_id uuid)
returns int
language sql
security definer set search_path = public
as $$
  select count(*)::int
  from feedback
  where user_id = p_user_id
    and created_at > now() - interval '1 hour';
$$;

grant execute on function count_recent_feedback(uuid) to authenticated;
