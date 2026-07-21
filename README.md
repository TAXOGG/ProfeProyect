# ProfeProyecto

Portal web para que docentes en Costa Rica lleven su reportería de calificaciones (cotidiano,
pruebas, tareas, proyecto, asistencia) sin depender de un Excel, con miras a automatizar después
el traslado de esa data al SEA mediante una extensión de Chrome/Edge.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Supabase (Postgres + Auth) — modelo multi-colegio (institution → docente → sección → estudiantes)

## Poner en marcha

1. Crea un proyecto en [supabase.com](https://supabase.com) (o usa uno existente).
2. Copia `.env.local.example` a `.env.local` y llena `NEXT_PUBLIC_SUPABASE_URL` /
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` desde Project Settings → API.
3. Corre el contenido de `supabase/migrations/0001_init.sql` en el SQL Editor de tu proyecto
   Supabase (crea las tablas, RLS y triggers).
4. `npm install`
5. `npm run dev` y abre http://localhost:3000

Al registrarte por primera vez, la app te pedirá los datos de tu institución (onboarding) y
luego podrás crear tu primera sección (asignatura + nivel + grupo).

## Estructura

- `src/app/(app)/secciones/[sectionId]/...` — módulos por sección: estudiantes, cotidiano,
  pruebas, tareas, proyecto, asistencia, reportes, ajustes. Los módulos de notas (cotidiano,
  pruebas, tareas, proyecto, asistencia, reportes) están en el esquema SQL pero pendientes de UI.
- `src/lib/actions/` — Server Actions (mutaciones).
- `supabase/migrations/` — esquema SQL versionado.

## Pendiente (roadmap corto)

1. UI de captura para Cotidiano, Pruebas, Tareas, Proyecto, Asistencia (el esquema ya existe).
2. Cálculo del consolidado por periodo/anual y pantalla de "Registro".
3. Reportes (Acta de Notas, asistencia) — export a PDF.
4. Extensión Chrome/Edge para trasladar la data al SEA (pendiente hasta tener acceso a su código
   fuente/selectores).
