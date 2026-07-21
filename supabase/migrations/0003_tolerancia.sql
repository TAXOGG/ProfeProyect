-- Margen de tolerancia antes de avisar sobre un posible error de tipeo
-- (ej. puntos obtenidos muy por encima del máximo esperado en Cotidiano/Pruebas/Proyecto).
alter table rubric_config
  add column tolerancia_pct numeric not null default 0.10;
