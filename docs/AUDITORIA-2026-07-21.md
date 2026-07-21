# Auditoría ARCE — 2026-07-21

Documento de trabajo para que **Claude Sonnet 5** implemente las correcciones.
Cada ítem trae: severidad, archivos afectados, diagnóstico, instrucción concreta y
cómo verificar. Implementar en el orden dado (P0 primero). Después de cada bloque:
`npx tsc --noEmit`, `npx eslint src --quiet`, `npm run build`, commit + push, y
verificar en `https://arcecr.com` con el usuario de prueba (credenciales en la memoria
del proyecto; pedírselas al usuario si hace falta).

Reglas del proyecto: dev server del usuario corre aparte, NO borrar `.next` completo.
No commitear `ARCE.png` de la raíz. Mensajes de commit terminan con
`Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`. Migraciones nuevas van a
`supabase/migrations/` numeradas (la última es `0011`), y el USUARIO debe correrlas en
Supabase (no hay CLI de migración conectado) — avisarle explícitamente cuáles quedan
pendientes.

---

## PARTE 0 — "This page couldn't load" (P0, la prioridad)

### Diagnóstico raíz (confirmado leyendo el código)

Ese error es del navegador y aparece cuando la petición de navegación devuelve un 500
duro (función serverless que crashea) o falla la conexión. NO es un bug de una página
puntual: falla hasta en Estudiantes, que es de las más livianas → el problema es
**sistémico**, en la capa de auth/datos, no en el render de una página. Tres causas que
se suman:

1. **No existe NINGÚN `error.tsx` en toda la app.** Cualquier excepción lanzada en un
   Server Component (una llamada a Supabase que falla de forma transitoria) crashea la
   función y el navegador muestra el error crudo, sin posibilidad de reintento in-app.

2. **El middleware no tiene manejo de errores.** `src/lib/supabase/middleware.ts` →
   `updateSession()` llama `supabase.auth.getUser()`, que es un **round-trip de red al
   servidor de Auth de Supabase (GoTrue)**. Si esa llamada lanza (red intermitente,
   rate limit del free tier, cold start), el middleware lanza → **500 en CADA navegación
   afectada**. No hay try/catch.

3. **Demasiados round-trips seriales a Supabase por navegación.** Para
   `/secciones/[id]/estudiantes`:
   - middleware: `getUser()` (round-trip de auth)
   - `src/app/(app)/layout.tsx`: `getUser()` OTRA VEZ (segundo round-trip de auth) +
     `getActiveSections()` (query DB)
   - `src/app/(app)/secciones/[sectionId]/layout.tsx`: fetch de la sección (query DB)
   - la página: fetch de estudiantes (query DB)

   = **2 round-trips de auth + 3 queries DB, en serie**. Al navegar rápido se disparan
   muchas llamadas concurrentes que chocan con los límites de rate/conexión del free
   tier de Supabase → sube la probabilidad de un fallo transitorio. Encaja exactamente
   con el patrón reportado ("cada 3-4 navegaciones").

> Nota: ya se desactivó el prefetch del sidebar (commit previo), lo que redujo la carga
> de fondo. Falta atacar las tres causas de arriba.

### P0-A — Agregar error boundaries (impacto inmediato en el síntoma)

**Archivos a crear:** `src/app/(app)/error.tsx` y `src/app/global-error.tsx`.

`error.tsx` de segmento captura excepciones lanzadas durante el render de los Server
Components hijos y las convierte en una UI de reintento DENTRO del shell de la app, en
vez del error crudo del navegador. Es la red de seguridad que hace que un fallo
transitorio sea recuperable con un botón.

Crear `src/app/(app)/error.tsx` (client component, en español, estilo teal de la app):

```tsx
"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sirve para diagnosticar en los logs de Vercel sin exponerlo al docente.
    console.error("Error de render en la app:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl">
        ⚠️
      </div>
      <h2 className="text-lg font-semibold text-zinc-900">No se pudo cargar la página</h2>
      <p className="text-sm text-zinc-600">
        Puede ser una interrupción momentánea de la conexión. Tu trabajo guardado no se
        pierde. Intenta de nuevo.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Reintentar
        </button>
        <a
          href="/dashboard"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Ir al inicio
        </a>
      </div>
    </div>
  );
}
```

Crear `src/app/global-error.tsx` (captura fallos del layout raíz; debe incluir sus
propios `<html>`/`<body>`):

```tsx
"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", textAlign: "center" }}>
        <h2>No se pudo cargar ARCE</h2>
        <p>Verifica tu conexión e intenta de nuevo.</p>
        <button onClick={reset} style={{ padding: "0.5rem 1rem", marginTop: "1rem" }}>
          Reintentar
        </button>
      </body>
    </html>
  );
}
```

**Verificar:** build pasa; en producción, forzar un error transitorio es difícil, pero
confirmar que las rutas siguen renderizando normal y que el archivo existe en el bundle.

### P0-B — Blindar el middleware contra fallos de auth

**Archivo:** `src/lib/supabase/middleware.ts`.

Envolver la llamada a `getUser()` (y el flujo de sesión) en try/catch. Si Supabase Auth
falla de forma transitoria, NO se debe devolver 500: dejar pasar la petición con la
respuesta/base de cookies ya construida (el peor caso es que una navegación puntual
quede sin refrescar la sesión, no que la app caiga). Mantener el redirect a `/login`
SOLO cuando `getUser()` respondió correctamente con `user === null` (sesión realmente
ausente), no cuando lanzó una excepción.

Patrón:

```ts
let user = null;
try {
  const { data } = await supabase.auth.getUser();
  user = data.user;
} catch {
  // Falla transitoria del Auth server (rate limit / red / cold start).
  // No tumbar la navegación: dejar pasar con las cookies actuales.
  return supabaseResponse;
}
// ...resto de la lógica de redirect usando `user` solo si la llamada tuvo éxito.
```

**Verificar:** login sigue funcionando; rutas protegidas siguen redirigiendo a `/login`
cuando de verdad no hay sesión (probar en incógnito).

### P0-C — Deduplicar y abaratar la verificación de sesión

**Archivos:** crear `src/lib/auth.ts`; editar `src/app/(app)/layout.tsx`.

Problema: el layout llama `getUser()` (segundo round-trip de auth de la request) solo
para tener `user.id` y consultar el `full_name` del perfil.

1. Crear un helper memoizado por request:

```ts
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
```

Usarlo en el layout y en cualquier Server Action/página que necesite el usuario, para
que `cache()` colapse llamadas repetidas dentro del mismo render.

2. **Opción de mayor impacto (requiere config del USUARIO en Supabase):** migrar el
   proyecto a **JWT asimétrico** (Dashboard → Authentication → JWT Keys → migrar a
   claves asimétricas). Con eso, `supabase.auth.getClaims()` verifica el token
   **localmente sin round-trip a GoTrue**. Una vez habilitado, reemplazar los
   `getUser()` de solo-lectura (middleware y helper) por `getClaims()` para eliminar por
   completo la latencia de auth. Dejar esto documentado y avisar al usuario que es un
   toggle del dashboard; si no lo hace, `getClaims()` cae de vuelta a una llamada de red
   (sin empeorar lo actual).

**Verificar:** el nombre del docente sigue apareciendo en el sidebar; navegación
notablemente más rápida (medir con Navigation Timing en el navegador).

### P0-D — Deduplicar el fetch de la sección

**Archivos:** crear helper en `src/lib/sections-data.ts` (ya existe `getActiveSections`);
editar `src/app/(app)/secciones/[sectionId]/layout.tsx`.

Agregar un `getSectionById(sectionId)` envuelto en `cache()` para que el layout de
sección y cualquier página/acción que necesite los datos de la sección compartan una
sola query por request, en vez de re-consultar.

```ts
export const getSectionById = cache(async (sectionId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sections")
    .select("nombre, nivel, asignatura, ciclo_escolar, institutions ( nombre )")
    .eq("id", sectionId)
    .single();
  return data;
});
```

**Verificar:** el encabezado de la sección sigue mostrándose; `notFound()` sigue
disparando en secciones inexistentes o ajenas (RLS).

---

## PARTE 1 — Seguridad (P1, la plataforma ya es pública)

### P1-A — Escalada de privilegios en `profiles` (latente)

**Archivo:** nueva migración `supabase/migrations/0012_lock_profiles_role.sql`.

La política `actualizar mi propio perfil` (migración 0001) es
`for update using (id = auth.uid())` **sin `with check` que restrinja columnas**. Un
usuario autenticado puede hacer `update profiles set role='admin' where id = auth.uid()`.
Hoy es inofensivo (la función `is_admin()` se eliminó en 0004 y `role` no otorga nada),
pero es una bomba de tiempo si se reintroduce lógica de admin.

Corregir con un trigger que impida cambiar `role` (o `id`) desde el cliente:

```sql
create or replace function prevent_role_self_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role then
    new.role := old.role; -- ignora cualquier intento de cambiar el rol
  end if;
  return new;
end;
$$;

drop trigger if exists lock_profile_role on profiles;
create trigger lock_profile_role
  before update on profiles
  for each row execute procedure prevent_role_self_change();
```

**Verificar (USUARIO corre la migración):** intentar cambiar el propio `role` vía el
cliente no surte efecto.

### P1-B — Cabeceras de seguridad HTTP

**Archivo:** `next.config.ts` (hoy está vacío).

Agregar `headers()` con cabeceras defensivas. La app maneja sesión y formularios con PII
de menores → clickjacking y sniffing importan.

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

Nota: `camera=(self)` porque el módulo de fotos usa la cámara. NO agregar una CSP
estricta a ciegas (puede romper Next/Vercel/Resend inline); si se quiere CSP, hacerlo en
una tarea aparte y probar a fondo en preview.

**Verificar:** build pasa; en producción revisar las response headers (DevTools → Network
→ documento → Headers).

### P1-C — Throttling de inserts públicos/abiertos

**Archivos:** `src/lib/actions/access-requests.ts`, `src/lib/actions/feedback.ts`
(+ posible migración para índice/consulta de conteo).

`access_requests` acepta inserts anónimos (por diseño) y `feedback` acepta inserts de
cualquier autenticado. Ninguno tiene rate limiting → vector de spam/DoS ahora que el
dominio es público. Mínimo viable:

- En `createAccessRequest`: agregar un **honeypot** (campo oculto en el form; si viene
  lleno, descartar silenciosamente) y un límite básico por ventana de tiempo (ej.
  rechazar si ya hay N solicitudes con el mismo correo en la última hora — consulta de
  conteo antes de insertar).
- En `submitFeedback`: limitar a N envíos por usuario por hora (consulta de conteo sobre
  `feedback` filtrando `user_id` y `created_at > now() - interval '1 hour'`).

Es defensa básica, no anti-abuso perfecto. Documentar el límite elegido.

**Verificar:** enviar el form normal funciona; superar el límite devuelve un error claro
sin crashear.

### P1-D — Confirmar configuración de Auth en Supabase (checklist para el USUARIO)

No es código; dejar como indicaciones para el usuario en el Dashboard de Supabase:

- **Email confirmations**: hoy los usuarios se crean con "Auto Confirm". Está bien para
  alta manual, pero confirmar que el registro abierto siga deshabilitado (la app no
  expone signup, solo `/solicitar-acceso`).
- **Leaked password protection**: activar (Authentication → Policies) para rechazar
  contraseñas comprometidas.
- **Rate limits de Auth**: revisar los límites del proyecto; el free tier es agresivo y
  contribuye al P0. Considerar upgrade si el uso crece.
- **Backups**: confirmar que hay backups del proyecto (PII de menores).

### P1-E — Defensa en profundidad en Server Actions (verificado, baja prioridad)

Varias actions operan por `id` crudo confiando en RLS
(`deleteStudent`, `updateStudentEstado`, `updateStudentContacto`, `deleteStudentPhoto`,
`upsertPuntaje`, etc.). **Esto es correcto**: la RLS (`owns_section`, políticas por
sección) sí impide que un docente toque datos de otro, verificado en las migraciones
0001/0004/0007. No hay fuga de datos. Recomendación opcional (no urgente): documentar en
un comentario que la autorización recae en RLS, para que nadie asuma que falta un check.
NO hace falta agregar checks redundantes salvo que se quiera doble barrera en los
`delete` críticos.

---

## PARTE 2 — Robustez / UX (P2)

### P2-A — Condición de carrera en el `numero` autoincremental

**Archivos:** `src/lib/actions/students.ts` (`createStudent`),
`src/lib/actions/cotidiano.ts` (`createIndicador`), y equivalentes en exams/homework/
project si aplican.

Usan `count + 1` para asignar `numero`. Dos inserts casi simultáneos → mismo `numero` →
viola el `unique (section_id, numero)` y la action lanza (posible 500 sin error
boundary; con P0-A al menos sería recuperable). Opciones: (a) capturar el error de
violación de unicidad y reintentar con `max(numero)+1`; o (b) mover la asignación a la
DB con una secuencia/`max+1` dentro de una transacción. Prioridad baja (poco probable
con un solo docente por sección) pero conviene el manejo defensivo del error de
unicidad.

### P2-B — Logo con `<Image>` dispara `/_next/image` por página

**Archivo:** `src/components/sidebar.tsx` (y `src/app/login/page.tsx`).

El logo estático usa `next/image` → una request extra a `/_next/image` en cada página, y
consume cuota de optimización del plan Hobby. Para un PNG chico y fijo conviene
`<Image ... unoptimized />` o un `<img>` plano. Impacto menor pero suma en el conteo de
requests que agrava el P0.

### P2-C — (Opcional, más adelante) skeleton de carga con Suspense

Se removió `loading.tsx` a nivel de `[sectionId]` por un bug de hidratación previo (ver
memoria del proyecto). Con los error boundaries (P0-A) y los datos más rápidos (P0-C/D),
más adelante se puede reintroducir un skeleton usando `<Suspense>` LOCAL alrededor de un
client component que lea `searchParams` con `useSearchParams()`, NUNCA un `loading.tsx`
de segmento combinado con `searchParams` en el page (esa combinación fue la que rompió la
hidratación). Baja prioridad.

---

## Orden de implementación sugerido

1. **P0-A** (error boundaries) — ataca el síntoma de inmediato y hace todo lo demás más
   seguro de desplegar.
2. **P0-B** (middleware try/catch) — elimina la causa más probable del 500 intermitente.
3. **P0-C + P0-D** (dedupe auth + sección) — baja la frecuencia de fallos y acelera todo.
4. **P1-B** (headers) y **P1-A** (migración role) — endurecimiento rápido.
5. **P1-C** (throttling), **P1-D** (checklist Supabase para el usuario).
6. **P2-\*** cuando haya tiempo.

Tras P0-A..D, pedir al usuario que navegue rápido entre pantallas (incluida Estudiantes)
varias veces y confirmar que el error desapareció o quedó como una tarjeta de "Reintentar"
in-app en vez del error crudo del navegador.

## Migraciones que el USUARIO debe correr en Supabase tras esta auditoría

- `0010_asistencia_nota.sql` y `0011_asistencia_umbrales.sql` (si aún no las corrió).
- `0012_lock_profiles_role.sql` (nueva, P1-A) — una vez creada.
