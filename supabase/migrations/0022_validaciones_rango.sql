-- Validación de rango a nivel de base de datos para las notas: hasta ahora
-- solo existía un aviso de "posible error" en el cliente (tolerancia_pct),
-- que el docente puede confirmar igual. Esto agrega un piso real que ningún
-- camino de escritura puede saltarse: nada de puntajes negativos ni de
-- puntos_max en cero o negativo (rompería el cálculo de porcentaje).
--
-- Se agregan como NOT VALID: no se revisan filas ya existentes (evita que
-- la migración falle por datos previos), pero sí se exige desde ahora en
-- cada insert/update nuevo.

alter table cotidiano_scores
  add constraint cotidiano_scores_puntaje_no_negativo check (puntaje >= 0) not valid;
alter table exam_scores
  add constraint exam_scores_puntos_no_negativo check (puntos_obtenidos >= 0) not valid;
alter table homework_scores
  add constraint homework_scores_nota_no_negativa check (nota >= 0) not valid;
alter table project_scores
  add constraint project_scores_puntos_no_negativo check (puntos_obtenidos >= 0) not valid;
alter table attendance_records
  add constraint attendance_records_ausencias_no_negativas check (ausencias >= 0) not valid;

alter table cotidiano_indicators
  add constraint cotidiano_indicators_puntos_max_positivo check (puntos_max > 0) not valid;
alter table exams
  add constraint exams_puntos_max_positivo check (puntos_max > 0) not valid;
alter table project_stages
  add constraint project_stages_puntos_max_positivo check (puntos_max > 0) not valid;
