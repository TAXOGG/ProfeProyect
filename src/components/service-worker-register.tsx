"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sin service worker la app sigue funcionando normal, solo pierde el
      // modo sin conexión — no hace falta molestar al docente con un error.
    });
  }, []);

  return null;
}
