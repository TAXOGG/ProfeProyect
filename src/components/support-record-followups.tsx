"use client";

import { useRef, useState, useTransition } from "react";
import { addFollowup } from "@/lib/actions/support-records";
import type { SupportRecordFollowup } from "@/lib/types";

export function SupportRecordFollowups({
  sectionId,
  recordId,
  followups,
}: {
  sectionId: string;
  recordId: string;
  followups: SupportRecordFollowup[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-zinc-900">Seguimiento</h3>

      <div className="mt-3 flex flex-col gap-2">
        {followups.map((f) => (
          <div key={f.id} className="rounded-md bg-zinc-50 px-3 py-2 text-sm">
            <p className="text-zinc-700">{f.nota}</p>
            <p className="mt-0.5 text-xs text-zinc-400">
              {new Date(f.created_at).toLocaleString("es-CR")}
            </p>
          </div>
        ))}
        {followups.length === 0 && (
          <p className="text-xs text-zinc-400">Todavía no hay notas de seguimiento.</p>
        )}
      </div>

      <form
        ref={formRef}
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            try {
              await addFollowup(sectionId, recordId, fd);
              formRef.current?.reset();
            } catch (e) {
              setError(e instanceof Error ? e.message : "No se pudo guardar.");
            }
          });
        }}
        className="mt-3 flex items-end gap-2"
      >
        <div className="flex-1">
          <label className="block text-xs font-medium text-zinc-600">Agregar nota</label>
          <input
            name="nota"
            required
            placeholder="Qué pasó, avance observado..."
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm placeholder:text-zinc-400"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          Agregar
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
