-- Regla oficial del MEP: convertir N tardanzas acumuladas en 1 ausencia injustificada
-- adicional. Opt-in por sección (null = no convertir tardanzas, comportamiento actual).
alter table rubric_config
  add column if not exists tardanzas_por_ausencia integer
  check (tardanzas_por_ausencia is null or tardanzas_por_ausencia >= 1);
