"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/offline/db";
import { flushQueue } from "@/lib/offline/sync-engine";

const RETRY_INTERVAL_MS = 15_000;

/**
 * Estado de conexión + cola pendiente, con reintento automático de subida.
 * Se monta una sola vez en el layout de la app para que la sincronización
 * corra en segundo plano sin importar en qué página esté el docente.
 */
export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const pending = useLiveQuery(() => db.syncQueue.count(), [], 0);

  useEffect(() => {
    // navigator.onLine no existe durante el render en el servidor; hay que
    // leerlo en un efecto para evitar un mismatch de hidratación.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine);
    function goOnline() {
      setIsOnline(true);
    }
    function goOffline() {
      setIsOnline(false);
    }
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    async function trySync() {
      if (!navigator.onLine) return;
      const count = await db.syncQueue.count();
      if (count === 0) return;
      setIsSyncing(true);
      await flushQueue();
      setIsSyncing(false);
    }

    trySync();
    const interval = setInterval(trySync, RETRY_INTERVAL_MS);
    window.addEventListener("online", trySync);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", trySync);
    };
  }, [isOnline]);

  return { isOnline, isSyncing, pending: pending ?? 0 };
}
