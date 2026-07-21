// Service Worker de HojaViva.
//
// Solo cachea archivos estáticos con hash en el nombre (JS/CSS de
// /_next/static/) — esos son seguros de guardar indefinidamente y no
// cambian nunca de contenido.
//
// A propósito NO intercepta ni cachea la navegación entre páginas (el HTML):
// Next.js envía esas respuestas en streaming (React Server Components), y
// interceptarlas con cache.put() rompe ese streaming — la página se queda
// pegada mostrando el esqueleto de carga para siempre. El modo sin conexión
// de los módulos de notas no depende de esto: usa una base de datos local
// (ver src/lib/offline) que funciona sin importar si la página en sí se
// pudo volver a cargar o no.
//
// Los guardados de notas (Server Actions, POST) tampoco pasan por acá —
// esos los maneja la cola de sincronización de la app.

const CACHE_NAME = "hojaviva-shell-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/_next/static/")) return;

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        }),
    ),
  );
});
