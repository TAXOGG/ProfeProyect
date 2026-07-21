"use client";

import { useSyncStatus } from "@/lib/offline/use-sync-status";

export function SyncStatusBanner() {
  const { isOnline, isSyncing, pending } = useSyncStatus();

  if (isOnline && pending === 0) return null;

  return (
    <div
      className={`no-print flex items-center justify-center gap-2 px-4 py-1.5 text-center text-xs font-medium ${
        isOnline ? "bg-amber-100 text-amber-800" : "bg-zinc-800 text-white"
      }`}
    >
      {!isOnline && (
        <span>
          Sin conexión — lo que registrés se guarda en este dispositivo y se sube solo cuando
          vuelva internet.
        </span>
      )}
      {isOnline && pending > 0 && (
        <span>
          {isSyncing
            ? "Subiendo cambios pendientes..."
            : `${pending} cambio${pending === 1 ? "" : "s"} pendiente${pending === 1 ? "" : "s"} de subir...`}
        </span>
      )}
    </div>
  );
}
