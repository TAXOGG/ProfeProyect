"use client";

import { useState, useTransition } from "react";
import { createAccessRequest } from "@/lib/actions/access-requests";

export function SolicitudAccesoForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createAccessRequest(formData);
        setSent(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo enviar la solicitud.");
      }
    });
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
        Solicitud enviada. Te contactaremos por correo cuando tu cuenta esté lista.
      </div>
    );
  }

  return (
    <form action={submit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700">Nombre completo</label>
        <input
          name="nombre"
          type="text"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700">Correo</label>
        <input
          name="correo"
          type="email"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700">Institución</label>
        <input
          name="institucion"
          type="text"
          required
          placeholder="Liceo de Santa Ana"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700">Teléfono (opcional)</label>
        <input
          name="telefono"
          type="tel"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700">Mensaje (opcional)</label>
        <textarea
          name="mensaje"
          rows={3}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
      >
        {isPending ? "Enviando..." : "Solicitar acceso"}
      </button>
    </form>
  );
}
